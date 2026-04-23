import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const API_URL = "http://192.168.0.138:8080";

type Expense = {
  id: number;
  title: string;
  amount: number;
  category?: string;
  date?: string;
};

type CategoryItem = {
  name: string;
};

const defaultCategoryColors: Record<
  string,
  { bg: string; text: string; glow: string }
> = {
  Food: { bg: "rgba(34,197,94,0.14)", text: "#15803d", glow: "#22c55e" },
  Transport: { bg: "rgba(59,130,246,0.14)", text: "#1d4ed8", glow: "#3b82f6" },
  Shopping: { bg: "rgba(236,72,153,0.14)", text: "#be185d", glow: "#ec4899" },
  Bills: { bg: "rgba(245,158,11,0.16)", text: "#b45309", glow: "#f59e0b" },
  Beauty: { bg: "rgba(168,85,247,0.14)", text: "#7e22ce", glow: "#a855f7" },
  Other: { bg: "rgba(99,102,241,0.12)", text: "#4338ca", glow: "#6366f1" },
};

function getCategoryColors(category: string) {
  return (
    defaultCategoryColors[category] || {
      bg: "rgba(99,102,241,0.14)",
      text: "#4c1d95",
      glow: "#7c3aed",
    }
  );
}

type PressScaleProps = {
  children: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

function PressScale({
  children,
  onPress,
  disabled,
  style,
}: PressScaleProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const handleIn = () => {
    if (disabled) return;
    Animated.spring(scale, {
      toValue: 0.96,
      useNativeDriver: true,
      friction: 6,
      tension: 420,
    }).start();
  };

  const handleOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      friction: 6,
      tension: 420,
    }).start();
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handleIn}
      onPressOut={handleOut}
      disabled={disabled}
      style={[style, disabled && { opacity: 0.5 }]}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

type AnimatedExpenseRowProps = {
  item: Expense;
  animateEnter: boolean;
  onDelete: (id: number) => void;
};

function AnimatedExpenseRow({
  item,
  animateEnter,
  onDelete,
}: AnimatedExpenseRowProps) {
  const opacity = useRef(new Animated.Value(animateEnter ? 0 : 1)).current;
  const translateY = useRef(new Animated.Value(animateEnter ? 16 : 0)).current;

  useEffect(() => {
    if (!animateEnter) {
      opacity.setValue(1);
      translateY.setValue(0);
      return;
    }

    opacity.setValue(0);
    translateY.setValue(16);

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 440,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 440,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [animateEnter, opacity, translateY]);

  const category = item.category || "Other";
  const colors = getCategoryColors(category);

  return (
    <Animated.View
      style={[
        styles.expenseCardOuter,
        { opacity, transform: [{ translateY }] },
      ]}
    >
      <View style={styles.expenseCard}>
        <View style={styles.expenseLeft}>
          <Text style={styles.expenseTitle}>{item.title}</Text>
          <Text style={styles.expenseAmount}>₺{item.amount}</Text>
          <Text style={styles.expenseDate}>{item.date || "No date"}</Text>

          <View style={[styles.badge, { backgroundColor: colors.bg }]}>
            <Text style={[styles.badgeText, { color: colors.text }]}>
              {category}
            </Text>
          </View>
        </View>

        <PressScale
          style={styles.deleteButton}
          onPress={() => onDelete(item.id)}
        >
          <Text style={styles.deleteButtonText}>Delete</Text>
        </PressScale>
      </View>
    </Animated.View>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState("");
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [newExpenseIds, setNewExpenseIds] = useState<Set<number>>(new Set());

  const prevExpenseIdsRef = useRef<Set<number> | null>(null);
  const screenFade = useRef(new Animated.Value(0)).current;

  const fetchExpenses = async () => {
    try {
      const res = await fetch(`${API_URL}/expenses`);
      const data = await res.json();
      setExpenses(data);
    } catch (error) {
      console.log("Fetch expenses error:", error);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_URL}/categories`);
      const data: CategoryItem[] = await res.json();
      setCategories(data.map((item) => item.name));
    } catch (error) {
      console.log("Fetch categories error:", error);
    }
  };

  useEffect(() => {
    fetchExpenses();
    fetchCategories();
  }, []);

  useEffect(() => {
    Animated.timing(screenFade, {
      toValue: 1,
      duration: 720,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [screenFade]);

  useEffect(() => {
    const current = new Set(expenses.map((e) => e.id));

    if (prevExpenseIdsRef.current === null) {
      prevExpenseIdsRef.current = current;
      return;
    }

    const added = new Set<number>();
    current.forEach((id) => {
      if (!prevExpenseIdsRef.current!.has(id)) {
        added.add(id);
      }
    });

    prevExpenseIdsRef.current = current;

    if (added.size > 0) {
      setNewExpenseIds(added);
      const timer = setTimeout(() => setNewExpenseIds(new Set()), 900);
      return () => clearTimeout(timer);
    }
  }, [expenses]);

  const isFormValid = useMemo(() => {
    return (
      title.trim().length > 0 &&
      amount.trim().length > 0 &&
      selectedCategory !== null
    );
  }, [title, amount, selectedCategory]);

  const handleAddExpense = async () => {
    if (!isFormValid || !selectedCategory) {
      setShowValidation(true);
      return;
    }

    try {
      await fetch(`${API_URL}/expense`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          amount: Number(amount),
          category: selectedCategory,
          date: new Date().toISOString().split("T")[0],
        }),
      });

      setTitle("");
      setAmount("");
      setSelectedCategory(null);
      setShowValidation(false);
      fetchExpenses();
    } catch (error) {
      console.log("Add expense error:", error);
    }
  };

  const handleDeleteExpense = async (id: number) => {
    try {
      await fetch(`${API_URL}/expense/${id}`, {
        method: "DELETE",
      });
      fetchExpenses();
    } catch (error) {
      console.log("Delete expense error:", error);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;

    try {
      await fetch(`${API_URL}/categories`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newCategory.trim(),
        }),
      });

      const savedName = newCategory.trim();
      setNewCategory("");
      setShowAddCategory(false);
      await fetchCategories();
      setSelectedCategory(savedName);
    } catch (error) {
      console.log("Add category error:", error);
    }
  };

  const totalAmount = expenses.reduce((sum, item) => sum + item.amount, 0);

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <LinearGradient
        colors={["#eef0ff", "#e8e4ff", "#f3efff", "#e0e7ff"]}
        locations={[0, 0.35, 0.72, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <View pointerEvents="none" style={styles.ambientGlowTop} />
      <View pointerEvents="none" style={styles.ambientGlowBottom} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Math.max(insets.top + 12, 52),
            paddingBottom: Math.max(insets.bottom + 28, 40),
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: screenFade }}>
          <Text style={styles.title}>Expense Tracker</Text>
          <Text style={styles.subtitle}>Track your daily spending easily</Text>

          <View style={styles.summaryWrap}>
            <View style={styles.summaryGlow} />
            <LinearGradient
              colors={["#3730a3", "#5b21b6", "#6d28d9"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.summaryCard}
            >
              <Text style={styles.summaryLabel}>Total Spending</Text>
              <Text style={styles.summaryAmount}>₺{totalAmount}</Text>
              <Text style={styles.summarySmall}>
                {expenses.length} expense{expenses.length !== 1 ? "s" : ""}
              </Text>
            </LinearGradient>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.sectionTitle}>Add New Expense</Text>

            <TextInput
              placeholder="What did you spend on?"
              placeholderTextColor="rgba(67,56,202,0.45)"
              value={title}
              onChangeText={(text) => {
                setTitle(text);
                if (showValidation) setShowValidation(false);
              }}
              style={styles.input}
            />

            <TextInput
              placeholder="Amount"
              placeholderTextColor="rgba(67,56,202,0.45)"
              value={amount}
              onChangeText={(text) => {
                setAmount(text);
                if (showValidation) setShowValidation(false);
              }}
              keyboardType="numeric"
              style={styles.input}
            />

            <Text style={styles.categoryLabel}>Choose category</Text>

            <View style={styles.categoryContainer}>
              {categories.map((category) => {
                const isSelected = selectedCategory === category;
                const colors = getCategoryColors(category);

                return (
                  <PressScale
                    key={category}
                    onPress={() => {
                      setSelectedCategory(category);
                      if (showValidation) setShowValidation(false);
                    }}
                    style={[
                      styles.categoryChip,
                      {
                        backgroundColor: isSelected
                          ? colors.bg
                          : "rgba(255,255,255,0.55)",
                        borderColor: isSelected
                          ? "rgba(255,255,255,0.95)"
                          : "rgba(99,102,241,0.18)",
                        ...(isSelected
                          ? {
                              shadowColor: colors.glow,
                              shadowOffset: { width: 0, height: 0 },
                              shadowOpacity: 0.55,
                              shadowRadius: 12,
                              elevation: 6,
                            }
                          : {
                              shadowColor: "#312e81",
                              shadowOffset: { width: 0, height: 4 },
                              shadowOpacity: 0.06,
                              shadowRadius: 8,
                              elevation: 2,
                            }),
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.categoryChipText,
                        {
                          color: isSelected
                            ? colors.text
                            : "rgba(55,48,163,0.72)",
                        },
                      ]}
                    >
                      {category}
                    </Text>
                  </PressScale>
                );
              })}
            </View>

            <PressScale
              onPress={() => setShowAddCategory(!showAddCategory)}
              style={styles.addCategoryToggle}
            >
              <Text style={styles.addCategoryToggleText}>
                + Add new category
              </Text>
            </PressScale>

            {showAddCategory && (
              <View style={styles.addCategoryBox}>
                <TextInput
                  placeholder="New category name"
                  placeholderTextColor="rgba(67,56,202,0.45)"
                  value={newCategory}
                  onChangeText={setNewCategory}
                  style={styles.input}
                />

                <PressScale
                  style={styles.saveCategoryButton}
                  onPress={handleAddCategory}
                >
                  <LinearGradient
                    colors={["#312e81", "#4c1d95"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.saveCategoryGradient}
                  >
                    <Text style={styles.saveCategoryButtonText}>
                      Save Category
                    </Text>
                  </LinearGradient>
                </PressScale>
              </View>
            )}

            {showValidation && (
              <Text style={styles.validationText}>
                Please fill title, amount, and choose a category.
              </Text>
            )}

            <PressScale
              style={[
                styles.addButtonWrap,
                !isFormValid && styles.addButtonDisabledWrap,
              ]}
              onPress={handleAddExpense}
            >
              <LinearGradient
                colors={
                  isFormValid
                    ? ["#6366f1", "#7c3aed", "#6d28d9"]
                    : ["#a5b4fc", "#c4b5fd", "#a78bfa"]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.addButtonInner}
              >
                <Text style={styles.addButtonText}>Add Expense</Text>
              </LinearGradient>
            </PressScale>
          </View>

          <View style={styles.listSection}>
            <Text style={styles.sectionTitle}>Your Expenses</Text>

            {expenses.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>No expenses yet</Text>
                <Text style={styles.emptySubtext}>
                  Add your first expense above
                </Text>
              </View>
            ) : (
              expenses.map((item) => (
                <AnimatedExpenseRow
                  key={item.id}
                  item={item}
                  animateEnter={newExpenseIds.has(item.id)}
                  onDelete={handleDeleteExpense}
                />
              ))
            )}
          </View>

          <Text style={styles.signature}>Designed by Duygu Toplu</Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#eef0ff",
  },
  scroll: {
    flex: 1,
    backgroundColor: "transparent",
  },
  content: {
    paddingHorizontal: 22,
  },
  ambientGlowTop: {
    position: "absolute",
    top: -80,
    right: -60,
    width: 260,
    height: 260,
    borderRadius: 200,
    backgroundColor: "rgba(167,139,250,0.35)",
    opacity: 0.55,
  },
  ambientGlowBottom: {
    position: "absolute",
    bottom: 40,
    left: -100,
    width: 280,
    height: 280,
    borderRadius: 200,
    backgroundColor: "rgba(129,140,248,0.28)",
    opacity: 0.45,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#1e1b4b",
    letterSpacing: -0.8,
  },
  subtitle: {
    fontSize: 15,
    color: "rgba(49,46,129,0.62)",
    marginTop: 8,
    marginBottom: 26,
    letterSpacing: 0.15,
    lineHeight: 22,
  },
  summaryWrap: {
    marginBottom: 22,
    position: "relative",
  },
  summaryGlow: {
    position: "absolute",
    left: 8,
    right: 8,
    top: 14,
    height: 72,
    borderRadius: 28,
    backgroundColor: "#6d28d9",
    opacity: 0.28,
    shadowColor: "#5b21b6",
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.55,
    shadowRadius: 36,
    elevation: 16,
  },
  summaryCard: {
    borderRadius: 26,
    paddingVertical: 24,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    shadowColor: "#312e81",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.35,
    shadowRadius: 32,
    elevation: 14,
  },
  summaryLabel: {
    color: "rgba(226,232,255,0.82)",
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  summaryAmount: {
    color: "#ffffff",
    fontSize: 42,
    fontWeight: "800",
    letterSpacing: -1.2,
  },
  summarySmall: {
    color: "rgba(224,231,255,0.72)",
    fontSize: 14,
    marginTop: 10,
    fontWeight: "500",
    letterSpacing: 0.2,
  },
  formCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 22,
    backgroundColor: "rgba(255,255,255,0.52)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.82)",
    shadowColor: "#3730a3",
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.1,
    shadowRadius: 28,
    elevation: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#312e81",
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.78)",
    borderRadius: 16,
    paddingVertical: 15,
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#1e1b4b",
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "rgba(99,102,241,0.14)",
    shadowColor: "#312e81",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  categoryLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(49,46,129,0.75)",
    marginBottom: 12,
    letterSpacing: 0.2,
  },
  categoryContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 12,
  },
  categoryChip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.1,
  },
  addCategoryToggle: {
    marginTop: 2,
    marginBottom: 12,
    alignSelf: "flex-start",
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  addCategoryToggleText: {
    color: "#5b21b6",
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.15,
  },
  addCategoryBox: {
    marginBottom: 6,
  },
  saveCategoryButton: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 12,
    shadowColor: "#312e81",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 6,
  },
  saveCategoryGradient: {
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  saveCategoryButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  validationText: {
    color: "#b91c1c",
    fontSize: 13,
    marginBottom: 12,
    fontWeight: "600",
    letterSpacing: 0.1,
  },
  addButtonWrap: {
    borderRadius: 16,
    overflow: "hidden",
    marginTop: 6,
    shadowColor: "#5b21b6",
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.28,
    shadowRadius: 22,
    elevation: 8,
  },
  addButtonDisabledWrap: {
    shadowOpacity: 0.12,
  },
  addButtonInner: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  addButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  listSection: {
    marginTop: 2,
  },
  emptyCard: {
    borderRadius: 24,
    paddingVertical: 36,
    paddingHorizontal: 24,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.48)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.78)",
    shadowColor: "#3730a3",
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.08,
    shadowRadius: 22,
    elevation: 6,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#312e81",
    letterSpacing: -0.2,
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: "rgba(49,46,129,0.58)",
    textAlign: "center",
    lineHeight: 20,
  },
  expenseCardOuter: {
    marginBottom: 14,
  },
  expenseCard: {
    backgroundColor: "rgba(255,255,255,0.58)",
    borderRadius: 22,
    paddingVertical: 18,
    paddingHorizontal: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.88)",
    shadowColor: "#3730a3",
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.09,
    shadowRadius: 22,
    elevation: 8,
  },
  expenseLeft: {
    flex: 1,
    marginRight: 14,
  },
  expenseTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1e1b4b",
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  expenseAmount: {
    fontSize: 15,
    color: "rgba(49,46,129,0.78)",
    marginBottom: 6,
    fontWeight: "600",
  },
  expenseDate: {
    fontSize: 12,
    color: "rgba(67,56,202,0.55)",
    marginBottom: 10,
    fontWeight: "500",
    letterSpacing: 0.15,
  },
  badge: {
    alignSelf: "flex-start",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.55)",
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  deleteButton: {
    backgroundColor: "rgba(254,226,226,0.92)",
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(252,165,165,0.45)",
    shadowColor: "#b91c1c",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
  },
  deleteButtonText: {
    color: "#b91c1c",
    fontWeight: "700",
    fontSize: 13,
    letterSpacing: 0.2,
  },
  signature: {
    marginTop: 28,
    textAlign: "center",
    fontSize: 11,
    fontWeight: "500",
    color: "rgba(49,46,129,0.38)",
    letterSpacing: 0.8,
  },
});