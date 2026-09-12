import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StyleSheet, Text, View, Button } from 'react-native';
import { supabase } from './src/lib/supabase';
import Auth from './src/components/Auth';
import { startTracking, stopTracking } from './src/services/LocationService';
import StudentMap from './src/components/StudentMap';
import { registerForPushNotificationsAsync } from './src/services/NotificationService';

function LoginScreen({ navigation, setSession }) {
  return (
    <View style={styles.container}>
      <Auth onLogin={async (session) => {
        setSession(session);
        // Register for push notifications and save token to user profile
        if (session && session.user) {
          await registerForPushNotificationsAsync(session.user.id);
        }
        
        // Basic routing mock. A real app checks user role in Supabase.
        // For testing, we provide a choice here temporarily.
        // In production, this would be an automatic redirect based on role.
      }} />
      <View style={{marginTop: 40}}>
        <Text>Dev Shortcuts:</Text>
        <Button title="Go to Driver Home" onPress={() => navigation.navigate('DriverHome')} />
        <Button title="Go to Student Home" onPress={() => navigation.navigate('StudentHome')} />
      </View>
    </View>
  );
}

function DriverHomeScreen({ navigation }) {
  const [tracking, setTracking] = useState(false);

  const toggleTracking = async () => {
    if (tracking) {
      await stopTracking();
      setTracking(false);
      alert('Tracking stopped');
    } else {
      // Mock trip ID for demo purposes
      const tripId = "mock-trip-id-1234";
      const success = await startTracking(tripId);
      if (success) {
        setTracking(true);
        alert('Tracking started in background! Disconnect internet to test offline buffering.');
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Driver Dashboard</Text>
      <Text>Assigned Route: Route A</Text>
      <Text>Status: {tracking ? "Tracking Active" : "Not Tracking"}</Text>
      <Button 
        title={tracking ? "Stop Trip & GPS" : "Start Trip & GPS"} 
        onPress={toggleTracking} 
      />
      <Button title="Logout" onPress={() => navigation.popToTop()} />
    </View>
  );
}

function StudentHomeScreen({ navigation }) {
  const [etaData, setEtaData] = useState({ eta: "...", confidence: "..." });

  useEffect(() => {
    // Poll the ETA from the AI/ML backend periodically
    const fetchEta = async () => {
      try {
        const response = await fetch('http://10.0.2.2:8000/predict-eta', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            route_id: "Route A",
            boarding_point_id: "Manipal",
            distance_remaining_km: 4.2, // Mock distance
            current_speed_kmh: 35.0,    // Mock speed
            time_of_day: "08:30",       // Peak morning traffic
            day_of_week: 1              // Monday
          })
        });
        const data = await response.json();
        if (data.eta_minutes) {
          setEtaData({ eta: data.eta_minutes + " mins", confidence: data.confidence });
        }
      } catch (error) {
        console.error("Failed to fetch ETA:", error.message);
      }
    };
    
    fetchEta();
    const intervalId = setInterval(fetchEta, 15000); // refresh every 15s
    return () => clearInterval(intervalId);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Student Dashboard</Text>
      <Text>Your Bus: BUS-01</Text>
      <Text>ETA: {etaData.eta} ({etaData.confidence} Confidence)</Text>
      <Button title="View Live Map" onPress={() => navigation.navigate('Map')} />
      <Button title="Logout" onPress={() => navigation.popToTop()} />
    </View>
  );
}

function MapScreen() {
  return (
    <View style={{ flex: 1 }}>
      {/* Mock trip ID matching the driver's mock ID */}
      <StudentMap tripId="mock-trip-id-1234" />
    </View>
  );
}

const Stack = createNativeStackNavigator();

export default function App() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login">
          {props => <LoginScreen {...props} setSession={setSession} />}
        </Stack.Screen>
        <Stack.Screen name="DriverHome" component={DriverHomeScreen} />
        <Stack.Screen name="StudentHome" component={StudentHomeScreen} />
        <Stack.Screen name="Map" component={MapScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 10
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20
  }
});
