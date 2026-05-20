import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/foundation.dart';

import 'core/theme/app_theme.dart';
import 'core/services/notification_service.dart';
import 'core/services/iap_service.dart';
import 'firebase_options.dart';
import 'presentation/routers/app_router.dart';
import 'package:smart_odds/presentation/providers/auth_providers.dart';

void main() async {
  // Ensure widget bindings are initialized
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize Firebase for ALL platforms (web + mobile) using generated options
  try {
    await Firebase.initializeApp(
      options: DefaultFirebaseOptions.currentPlatform,
    );
    isFirebaseEnabled = true;

    if (!kIsWeb) {
      // Mobile-only: push notifications & Google Play IAP
      final notificationService = NotificationService();
      await notificationService.initialize();
      IAPService.instance.initialize();
      debugPrint("Firebase initialized (Mobile). FCM & IAP active.");
    } else {
      debugPrint("Firebase initialized (Web). Using real Firebase Auth & Firestore.");
    }
  } catch (e) {
    isFirebaseEnabled = false;
    debugPrint("Firebase init failed — falling back to mock mode: $e");
  }

  runApp(
    const ProviderScope(
      child: ALaOllaApp(),
    ),
  );
}

class ALaOllaApp extends ConsumerWidget {
  const ALaOllaApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(appRouterRefProvider);

    return MaterialApp.router(
      title: 'A la olla',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.darkTheme,
      routerConfig: router,
    );
  }
}
