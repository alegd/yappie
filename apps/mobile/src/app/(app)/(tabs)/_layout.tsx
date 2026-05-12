import { Tabs } from "expo-router";
import { PillTabBar } from "@/components/navigation/pill-tab-bar";
import { SettingsButton } from "@/components/navigation/settings-button";
import { colors } from "@/constants/theme";

export default function TabsLayout() {
  return (
    <Tabs
      initialRouteName="projects"
      tabBar={(props) => <PillTabBar {...props} />}
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
        headerTintColor: colors.text,
        headerTitle: "",
        headerRight: () => <SettingsButton />,
      }}
    >
      <Tabs.Screen name="home" />
      <Tabs.Screen name="projects" />
    </Tabs>
  );
}
