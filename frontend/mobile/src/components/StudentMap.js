import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { supabase } from '../lib/supabase';

export default function StudentMap({ tripId }) {
  const [busLocation, setBusLocation] = useState(null);

  useEffect(() => {
    // 1. Fetch the latest location initially
    const fetchLatestLocation = async () => {
      const { data, error } = await supabase
        .from('gps_locations')
        .select('*')
        .eq('trip_id', tripId)
        .order('recorded_at', { ascending: false })
        .limit(1);
      
      if (data && data.length > 0) {
        parseAndSetLocation(data[0].location);
      }
    };

    fetchLatestLocation();

    // 2. Subscribe to Realtime updates for this trip
    const channel = supabase
      .channel(`public:gps_locations:trip_id=eq.${tripId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'gps_locations', filter: `trip_id=eq.${tripId}` },
        (payload) => {
          console.log('New GPS update received!', payload.new);
          parseAndSetLocation(payload.new.location);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tripId]);

  const parseAndSetLocation = (postgisPoint) => {
    // Supabase returns PostGIS points as text, e.g., "POINT(longitude latitude)"
    if (!postgisPoint) return;
    try {
      const match = postgisPoint.match(/POINT\(([^ ]+) ([^ ]+)\)/);
      if (match) {
        setBusLocation({
          longitude: parseFloat(match[1]),
          latitude: parseFloat(match[2]),
        });
      }
    } catch (e) {
      console.error("Failed to parse location", e);
    }
  };

  return (
    <View style={styles.container}>
      {busLocation ? (
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: busLocation.latitude,
            longitude: busLocation.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
          region={{
            latitude: busLocation.latitude,
            longitude: busLocation.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
        >
          <Marker
            coordinate={{ latitude: busLocation.latitude, longitude: busLocation.longitude }}
            title="College Bus"
            description="Live Location"
            image={require('../../assets/favicon.png')} // Fallback icon
          />
        </MapView>
      ) : (
        <Text>Waiting for bus location...</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  map: {
    width: '100%',
    height: '100%',
  },
});
