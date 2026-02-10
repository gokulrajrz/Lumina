import React, { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Platform, View, TouchableOpacity, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
  withSequence,
  withRepeat
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { colors, typography } from '../../constants/theme';

const TabButton = ({
  route,
  descriptors,
  navigation,
  state,
  index,
  isIsolated = false
}: any) => {
  const { options } = descriptors[route.key];
  const label = options.tabBarLabel !== undefined
    ? options.tabBarLabel
    : options.title !== undefined
      ? options.title
      : route.name;

  const isFocused = state.index === index;

  // Scale animation for press feedback & focus pop
  const scale = useSharedValue(1);

  // Breathing animation for isolated tab
  const breathing = useSharedValue(1);

  useEffect(() => {
    if (isFocused) {
      // Pop effect when focused
      scale.value = withSequence(
        withTiming(1.15, { duration: 150 }),
        withSpring(1, { damping: 12, stiffness: 200 })
      );
    }
  }, [isFocused]);

  useEffect(() => {
    if (isIsolated && !isFocused) {
      // Breathing effect for Ask AI when not focused
      breathing.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    } else {
      breathing.value = 1;
    }
  }, [isIsolated, isFocused]);

  const animatedStyle = useAnimatedStyle(() => {
    // Combine scale (press/focus) and breathing (idle isolated)
    const activeScale = isIsolated && !isFocused ? breathing.value : scale.value;
    return {
      transform: [{ scale: activeScale }],
    };
  });

  const onPressIn = () => {
    scale.value = withSpring(0.9, { damping: 10, stiffness: 300 });
  };

  const onPressOut = () => {
    scale.value = withSpring(1, { damping: 10, stiffness: 300 });
  };

  const onPress = () => {
    const event = navigation.emit({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
    });

    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate(route.name, route.params);
    }
  };

  const onLongPress = () => {
    navigation.emit({
      type: 'tabLongPress',
      target: route.key,
    });
  };

  const iconColor = isFocused ? '#4DA6FF' : '#8E8E92';

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      accessibilityLabel={options.tabBarAccessibilityLabel}
      testID={options.tabBarTestID}
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={[
        styles.tabButton,
        isIsolated && styles.isolatedButton,
        isIsolated && isFocused && styles.isolatedButtonActive
        // Note: For non-isolated tabs, the background is handled by the shared animated indicator in parent
      ]}
      activeOpacity={1} // Disable default opacity change since we scale
    >
      <Animated.View style={[styles.tabContent, animatedStyle]}>
        {options.tabBarIcon && options.tabBarIcon({
          focused: isFocused,
          color: isIsolated && isFocused ? '#FFFFFF' : iconColor,
          size: 24
        })}
        {!isIsolated && (
          <Text style={{
            color: iconColor,
            fontSize: 10,
            fontWeight: '600',
            marginTop: 4
          }}>
            {label}
          </Text>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
};

const CustomTabBar = ({ state, descriptors, navigation }: any) => {
  const isIOS = Platform.OS === 'ios';

  // Group 1: First 3 tabs
  const mainTabs = state.routes.slice(0, 3);

  // Group 2: Last tab
  const isolatedTab = state.routes[3];
  const isolatedTabIndex = 3;

  // Animation values for pill indicator
  const indicatorPosition = useSharedValue(0);
  const indicatorOpacity = useSharedValue(1);

  useEffect(() => {
    if (state.index < 3) {
      // Move indicator to active tab index (0, 1, 2)
      indicatorPosition.value = withTiming(state.index, {
        duration: 300,
        easing: Easing.inOut(Easing.ease)
      });
      indicatorOpacity.value = withSpring(1);
    } else {
      // Fade out if switching to isolated tab
      indicatorOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [state.index]);

  const indicatorStyle = useAnimatedStyle(() => {
    return {
      opacity: indicatorOpacity.value,
      left: `${indicatorPosition.value * 33.33}%`
    };
  });

  // Reusable background component for Glass effect
  const GlassBackground = () => (
    isIOS ? (
      <BlurView tint="dark" intensity={80} style={StyleSheet.absoluteFill} />
    ) : (
      <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(21, 21, 21, 0.95)' }]} />
    )
  );

  return (
    <View style={[styles.tabContainer, { paddingBottom: isIOS ? 30 : 20 }]}>
      {/* Main Pill Container */}
      <View style={styles.pillShadowWrapper}>
        <View style={styles.pillInnerContainer}>
          <GlassBackground />

          <View style={styles.pillTrack}>
            <Animated.View style={[styles.activeIndicator, indicatorStyle]} />

            {mainTabs.map((route: any, index: number) => (
              <TabButton
                key={route.key}
                route={route}
                descriptors={descriptors}
                navigation={navigation}
                state={state}
                index={index}
              />
            ))}
          </View>
        </View>
      </View>

      {/* Isolated Circle Container */}
      {isolatedTab && (
        <View style={styles.circleContainer}>
          <GlassBackground />
          <TabButton
            key={isolatedTab.key}
            route={isolatedTab}
            descriptors={descriptors}
            navigation={navigation}
            state={state}
            index={isolatedTabIndex}
            isIsolated={true}
          />
        </View>
      )}
    </View>
  );
};

export default function TabLayout() {
  return (
    <Tabs
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'grid' : 'grid-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="journal"
        options={{
          title: 'Journal',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'book' : 'book-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="chart"
        options={{
          title: 'Chart',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'planet' : 'planet-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="ask"
        options={{
          title: 'Ask AI',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'sparkles' : 'sparkles-outline'} size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabContainer: {
    position: 'absolute',
    bottom: 0,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 0,
    // Add zIndex to ensure it floats above content
    zIndex: 1000,
  },
  pillShadowWrapper: {
    flex: 1,
    height: 60,
    marginRight: 15,
    borderRadius: 30,
    // Shadow needs a background to cast from, but we want glass.
    // iOS handles shadow on layer. We can try adding shadow props here.
    backgroundColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 5,
  },
  pillInnerContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    borderRadius: 30,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)', // Glass border
  },
  pillTrack: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    margin: 5,
    borderRadius: 25,
    position: 'relative',
  },
  activeIndicator: {
    position: 'absolute',
    width: '33.33%',
    height: '100%',
    top: 0,
    backgroundColor: 'rgba(255,255,255,0.15)', // Lighter glass for active
    borderRadius: 25,
    zIndex: 0,
  },
  circleContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 5,
  },
  tabButton: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
    borderRadius: 25,
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  isolatedButton: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  isolatedButtonActive: {
    backgroundColor: 'rgba(255,255,255,0.15)',
  }
});
