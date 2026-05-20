import 'dart:io';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:flutter/foundation.dart';

class NotificationService {
  final FirebaseMessaging _fcm = FirebaseMessaging.instance;
  final FlutterLocalNotificationsPlugin _localNotifications = FlutterLocalNotificationsPlugin();

  static const String channelId = "alaolla_live_alerts";
  static const String channelName = "A la olla Alertas";
  static const String channelDescription = "Notificaciones instantáneas de oportunidades y Value Bets en vivo.";
  
  static bool isPremium = false;
  static int notificationCountToday = 0;

  Future<void> initialize() async {
    // 1. Request OS Push Notification Permissions (critical for iOS and Android 13+)
    NotificationSettings settings = await _fcm.requestPermission(
      alert: true,
      badge: true,
      sound: true,
      provisional: false,
    );

    if (settings.authorizationStatus == AuthorizationStatus.authorized) {
      if (kDebugMode) {
        print("Push Notifications authorized by user!");
      }
    }

    // Explicitly trigger the Android 13+ permission dialog for local notifications
    if (Platform.isAndroid) {
      try {
        await _localNotifications
            .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
            ?.requestNotificationsPermission();
      } catch (e) {
        if (kDebugMode) {
          print("Error requesting Android 13+ notifications permission: $e");
        }
      }
    }

    // 2. Configure Android Local Notifications Channel
    const AndroidInitializationSettings androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');
    const DarwinInitializationSettings iosSettings = DarwinInitializationSettings();

    const InitializationSettings initSettings = InitializationSettings(
      android: androidSettings,
      iOS: iosSettings,
    );

    await _localNotifications.initialize(
      settings: initSettings,
      onDidReceiveNotificationResponse: (NotificationResponse response) {
        // Handle clicking on a notification
        if (kDebugMode) {
          print("Notification clicked! Payload: ${response.payload}");
        }
      },
    );

    // Create high-importance Android channel for heads-up notifications
    if (Platform.isAndroid) {
      final AndroidFlutterLocalNotificationsPlugin? androidImplementation =
          _localNotifications.resolvePlatformSpecificImplementation<
              AndroidFlutterLocalNotificationsPlugin>();
              
      if (androidImplementation != null) {
        const AndroidNotificationChannel channel = AndroidNotificationChannel(
          channelId,
          channelName,
          description: channelDescription,
          importance: Importance.max,
          playSound: true,
          enableVibration: true,
        );
        await androidImplementation.createNotificationChannel(channel);
      }
    }

    // 3. Subscribe to the 'alerts' Topic
    // This connects our device to the FCM topic our Python backend publishes to!
    await _fcm.subscribeToTopic('alerts');
    if (kDebugMode) {
      print("Subscribed to Firebase FCM topic 'alerts'.");
    }

    // 4. Handle Foreground Notifications
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      RemoteNotification? notification = message.notification;

      if (notification != null) {
        // Limit check for free mode
        if (!isPremium && notificationCountToday >= 3) {
          if (kDebugMode) {
            print("Notification suppressed: Free limit of 3 reached.");
          }
          return;
        }

        notificationCountToday++;
        const AndroidNotificationDetails androidDetails = AndroidNotificationDetails(
          channelId,
          channelName,
          channelDescription: channelDescription,
          importance: Importance.max,
          priority: Priority.high,
          playSound: true,
          enableVibration: true,
        );

        const NotificationDetails details = NotificationDetails(android: androidDetails);

        // Trigger a local notification so it displays in-app in real-time
        _localNotifications.show(
          id: notification.hashCode,
          title: notification.title,
          body: notification.body,
          notificationDetails: details,
          payload: message.data.toString(),
        );
      }
    });
  }
}
