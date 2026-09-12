import React, { useState, useEffect } from 'react';
import { View, Button, Text, StyleSheet } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { supabase } from '../lib/supabase';

WebBrowser.maybeCompleteAuthSession();

export default function Auth({ onLogin }) {
  const [loading, setLoading] = useState(false);

  const performGoogleLogin = async () => {
    try {
      setLoading(true);
      // Construct redirect URL for Expo
      const redirectUri = AuthSession.makeRedirectUri();
      console.log("Redirect URI:", redirectUri);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUri,
        },
      });

      if (error) throw error;

      if (data?.url) {
        // Open the browser to authenticate
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUri);
        if (result.type === 'success' && result.url) {
          // Parse the URL to get the tokens or session
          const { data: sessionData, error: sessionError } = await supabase.auth.getSessionFromUrl({
            url: result.url
          });
          
          if (sessionError) throw sessionError;
          if (sessionData.session) {
            onLogin(sessionData.session);
          }
        }
      }
    } catch (error) {
      console.error('Google Auth Error:', error.message);
      alert('Google Auth Failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Smart Bus System</Text>
      <Button 
        title={loading ? "Loading..." : "Sign in with Google"} 
        onPress={performGoogleLogin} 
        disabled={loading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  }
});
