import { Tabs } from "expo-router";
import { PillTabBar } from "@/components/navigation/pill-tab-bar";

export default function TabsLayout() {
  return (
    <Tabs
      initialRouteName="projects"
      tabBar={(props) => <PillTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="home" />
      <Tabs.Screen name="projects" />
    </Tabs>
  );
}
