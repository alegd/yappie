import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: "#0a0a0a", borderTopColor: "#27272a" },
        tabBarActiveTintColor: "#f97316",
        tabBarInactiveTintColor: "#71717a",
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Record" }} />
    </Tabs>
  );
}
