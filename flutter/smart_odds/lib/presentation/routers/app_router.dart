import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:smart_odds/presentation/providers/auth_providers.dart';
import '../screens/login_screen.dart';
import '../screens/register_screen.dart';
import '../screens/scaffold_with_navbar.dart';
import '../screens/alert_feed_screen.dart';
import '../screens/live_matches_screen.dart';
import '../screens/profile_screen.dart';
import '../screens/terms_screen.dart';

final appRouterRefProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authStateProvider);

  return GoRouter(
    initialLocation: '/alerts',
    redirect: (BuildContext context, GoRouterState state) {
      final user = authState.value;
      final loggingIn = state.matchedLocation == '/login' || state.matchedLocation == '/register' || state.matchedLocation == '/terms';

      if (user == null) {
        // Redirect to login if not logged in and not already navigating to auth screens
        return loggingIn ? null : '/login';
      }

      // If logged in, redirect away from auth screens to main alerts feed
      if (state.matchedLocation == '/login' || state.matchedLocation == '/register') {
        return '/alerts';
      }

      return null;
    },
    routes: [
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/register',
        builder: (context, state) => const RegisterScreen(),
      ),
      GoRoute(
        path: '/terms',
        builder: (context, state) => const TermsScreen(),
      ),
      ShellRoute(
        builder: (context, state, child) {
          return ScaffoldWithNavbar(child: child);
        },
        routes: [
          GoRoute(
            path: '/alerts',
            pageBuilder: (context, state) => const NoTransitionPage(
              child: AlertFeedScreen(),
            ),
          ),
          GoRoute(
            path: '/matches',
            pageBuilder: (context, state) => const NoTransitionPage(
              child: LiveMatchesScreen(),
            ),
          ),
          GoRoute(
            path: '/profile',
            pageBuilder: (context, state) => const NoTransitionPage(
              child: ProfileScreen(),
            ),
          ),
        ],
      ),
    ],
  );
});
