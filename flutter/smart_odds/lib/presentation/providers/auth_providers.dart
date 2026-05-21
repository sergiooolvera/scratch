import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../domain/repositories/auth_repository.dart';
import '../../core/services/firestore_service.dart';
import '../../domain/entities/alert.dart';
import '../../domain/entities/live_match.dart';

// Global flag — set to true once Firebase.initializeApp() succeeds
bool _isFirebaseEnabled = false;
bool get isFirebaseEnabled => _isFirebaseEnabled;
set isFirebaseEnabled(bool val) {
  _isFirebaseEnabled = val;
}

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  if (isFirebaseEnabled) {
    return FirebaseAuthRepository();
  } else {
    return MockAuthRepository();
  }
});

final authStateProvider = StreamProvider<User?>((ref) {
  return ref.watch(authRepositoryProvider).authStateChanges;
});

final userAuthenticatedProvider = Provider<User?>((ref) {
  return ref.watch(authStateProvider).value;
});

final firestoreServiceProvider = Provider<FirestoreService>((ref) {
  return FirestoreService();
});

// Stream active alerts (with local polling fallback if Firebase is disabled)
final alertsStreamProvider = StreamProvider<List<Alert>>((ref) {
  if (isFirebaseEnabled) {
    return ref.watch(firestoreServiceProvider).watchAlerts();
  } else {
    // Queries Railway FastAPI backend alerts every 2 seconds.
    final dio = Dio();
    const String url = "https://cheerful-appreciation-production-c36d.up.railway.app/alerts";
    
    return Stream.periodic(const Duration(seconds: 2)).asyncMap((_) async {
      try {
        final response = await dio.get(url);
        if (response.statusCode == 200) {
          final List data = response.data;
          return data.map((json) => Alert.fromJson(json, json['id'] ?? '')).toList();
        }
      } catch (e) {
        debugPrint("[Local Polling] Error fetching alerts: $e");
      }
      return <Alert>[];
    });
  }
});

// Stream live matches (with local polling fallback if Firebase is disabled)
final liveMatchesStreamProvider = StreamProvider<List<LiveMatch>>((ref) {
  if (isFirebaseEnabled) {
    return ref.watch(firestoreServiceProvider).watchLiveMatches();
  } else {
    // Queries Railway FastAPI backend live-matches every 2 seconds.
    final dio = Dio();
    const String url = "https://cheerful-appreciation-production-c36d.up.railway.app/live-matches";
    
    return Stream.periodic(const Duration(seconds: 2)).asyncMap((_) async {
      try {
        final response = await dio.get(url);
        if (response.statusCode == 200) {
          final List data = response.data;
          return data.map((json) => LiveMatch.fromJson(json, json['id'] ?? '')).toList();
        }
      } catch (e) {
        debugPrint("[Local Polling] Error fetching live matches: $e");
      }
      return <LiveMatch>[];
    });
  }
});

// Provider to keep track of dismissed alert IDs across screen changes with local persistence
class DismissedAlertsNotifier extends StateNotifier<Set<String>> {
  static const String _storageKey = 'dismissed_alerts_keys';

  DismissedAlertsNotifier() : super(<String>{}) {
    _loadFromPrefs();
  }

  Future<void> _loadFromPrefs() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final list = prefs.getStringList(_storageKey);
      if (list != null) {
        state = list.toSet();
      }
    } catch (e) {
      debugPrint("[Prefs] Error loading dismissed alerts: $e");
    }
  }

  Future<void> dismissAlert(String id) async {
    if (state.contains(id)) return;
    state = {...state, id};
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setStringList(_storageKey, state.toList());
    } catch (e) {
      debugPrint("[Prefs] Error saving dismissed alert: $e");
    }
  }

  Future<void> dismissAll(List<String> ids) async {
    final newState = {...state, ...ids};
    state = newState;
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setStringList(_storageKey, newState.toList());
    } catch (e) {
      debugPrint("[Prefs] Error saving dismissed alerts: $e");
    }
  }

  Future<void> restoreAlert(String id) async {
    if (!state.contains(id)) return;
    state = state.where((item) => item != id).toSet();
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setStringList(_storageKey, state.toList());
    } catch (e) {
      debugPrint("[Prefs] Error restoring alert: $e");
    }
  }

  Future<void> clearAll() async {
    state = <String>{};
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(_storageKey);
    } catch (e) {
      debugPrint("[Prefs] Error clearing dismissed alerts: $e");
    }
  }
}

final dismissedAlertsProvider = StateNotifierProvider<DismissedAlertsNotifier, Set<String>>((ref) {
  return DismissedAlertsNotifier();
});
