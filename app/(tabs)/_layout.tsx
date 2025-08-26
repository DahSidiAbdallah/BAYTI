import { Tabs } from 'expo-router';
import { Home, MapPin, Car, User, MessageCircle } from 'lucide-react-native';

function HomeIcon({ size, color }: Readonly<{ size?: number; color?: string }>) { return <Home size={size} color={color} />; }
function MapIcon({ size, color }: Readonly<{ size?: number; color?: string }>) { return <MapPin size={size} color={color} />; }
function CarIcon({ size, color }: Readonly<{ size?: number; color?: string }>) { return <Car size={size} color={color} />; }
function MessagesIcon({ size, color }: Readonly<{ size?: number; color?: string }>) { return <MessageCircle size={size} color={color} />; }
function UserIcon({ size, color }: Readonly<{ size?: number; color?: string }>) { return <User size={size} color={color} />; }

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#F0F0F0',
          paddingTop: 8,
          paddingBottom: 8,
          height: 80,
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarLabelStyle: {
          fontFamily: 'Inter-Medium',
          fontSize: 12,
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: HomeIcon,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Map',
          tabBarIcon: MapIcon,
        }}
      />
      <Tabs.Screen
        name="cars"
        options={{
          title: 'Cars',
          tabBarIcon: CarIcon,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: MessagesIcon,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: UserIcon,
        }}
      />
      <Tabs.Screen
        name="listing"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}