import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

const LOCATION_TASK_NAME = 'BACKGROUND_LOCATION_TASK';

// Define the background task
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error("Location Task Error:", error);
    return;
  }
  if (data) {
    const { locations } = data;
    
    // Process locations
    for (const loc of locations) {
      const locationData = {
        lat: loc.coords.latitude,
        lng: loc.coords.longitude,
        speed: loc.coords.speed,
        heading: loc.coords.heading,
        accuracy: loc.coords.accuracy,
        timestamp: new Date(loc.timestamp).toISOString()
      };
      
      await saveLocation(locationData);
    }
  }
});

const saveLocation = async (locationData) => {
  try {
    // 1. Try to send directly to Supabase
    // Note: In a real implementation, we need the active trip_id. For now, mocking.
    const trip_id = await AsyncStorage.getItem('active_trip_id');
    if (!trip_id) return; // No active trip

    const { error } = await supabase.from('gps_locations').insert([
      {
        trip_id,
        location: `POINT(${locationData.lng} ${locationData.lat})`,
        speed: locationData.speed,
        heading: locationData.heading,
        accuracy: locationData.accuracy,
        recorded_at: locationData.timestamp,
      }
    ]);

    if (error) {
      // 2. If it fails (offline), buffer it locally
      throw error;
    }
    
    // 3. If successful, check if we have buffered locations to sync
    await syncBufferedLocations();
    
  } catch (error) {
    console.warn("Failed to upload location, buffering locally...", error.message);
    bufferLocationLocally(locationData);
  }
};

const bufferLocationLocally = async (locationData) => {
  try {
    const existing = await AsyncStorage.getItem('buffered_locations');
    const locations = existing ? JSON.parse(existing) : [];
    locations.push(locationData);
    await AsyncStorage.setItem('buffered_locations', JSON.stringify(locations));
  } catch (e) {
    console.error("Failed to buffer location", e);
  }
};

const syncBufferedLocations = async () => {
  try {
    const existing = await AsyncStorage.getItem('buffered_locations');
    if (!existing) return;
    
    const locations = JSON.parse(existing);
    if (locations.length === 0) return;

    const trip_id = await AsyncStorage.getItem('active_trip_id');
    if (!trip_id) return;

    // Batch insert buffered locations
    const payload = locations.map(loc => ({
      trip_id,
      location: `POINT(${loc.lng} ${loc.lat})`,
      speed: loc.speed,
      heading: loc.heading,
      accuracy: loc.accuracy,
      recorded_at: loc.timestamp,
    }));

    const { error } = await supabase.from('gps_locations').insert(payload);
    
    if (!error) {
      // Clear buffer on success
      await AsyncStorage.removeItem('buffered_locations');
      console.log(`Successfully synced ${locations.length} offline locations.`);
    }
  } catch (e) {
    console.error("Failed to sync buffered locations", e);
  }
};

export const startTracking = async (tripId) => {
  const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
  if (foregroundStatus !== 'granted') {
    alert('Permission to access location was denied');
    return false;
  }

  const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
  if (backgroundStatus !== 'granted') {
    alert('Permission for background location was denied');
    return false;
  }

  await AsyncStorage.setItem('active_trip_id', tripId);

  await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
    accuracy: Location.Accuracy.Balanced,
    timeInterval: 10000, // Update every 10 seconds
    distanceInterval: 10, // Update every 10 meters
    deferredUpdatesInterval: 10000,
    showsBackgroundLocationIndicator: true,
    foregroundService: {
      notificationTitle: "Smart Bus",
      notificationBody: "Trip is active. Tracking GPS in background.",
      notificationColor: "#fff",
    },
  });
  return true;
};

export const stopTracking = async () => {
  await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
  await AsyncStorage.removeItem('active_trip_id');
  // Attempt final sync
  await syncBufferedLocations();
};
