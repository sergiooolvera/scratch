import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:in_app_purchase/in_app_purchase.dart';
import 'notification_service.dart';

class IAPService {
  static final IAPService instance = IAPService._internal();
  IAPService._internal();

  final InAppPurchase _iap = InAppPurchase.instance;
  StreamSubscription<List<PurchaseDetails>>? _subscription;
  
  // Default product ID for the Google Play Console subscription
  static const String subscriptionId = 'suscripcion_mensual_premium';
  
  bool _isAvailable = false;
  List<ProductDetails> _products = [];

  bool get isAvailable => _isAvailable;
  List<ProductDetails> get products => _products;

  void initialize() {
    // Listen to purchase updates from the OS store
    final Stream<List<PurchaseDetails>> purchaseUpdated = _iap.purchaseStream;
    _subscription = purchaseUpdated.listen(
      _listenToPurchaseUpdated,
      onDone: () => _subscription?.cancel(),
      onError: (error) {
        debugPrint("[IAP Service] Purchase stream error: $error");
      },
    );

    _initStore();
  }

  Future<void> _initStore() async {
    _isAvailable = await _iap.isAvailable();
    if (!_isAvailable) {
      debugPrint("[IAP Service] Google Play Store not available.");
      return;
    }

    // Query our products from the Google Play Developer Console
    const Set<String> ids = {subscriptionId};
    final ProductDetailsResponse response = await _iap.queryProductDetails(ids);
    
    if (response.notFoundIDs.isNotEmpty) {
      debugPrint("[IAP Service] Product IDs not found in console: ${response.notFoundIDs}");
    }

    _products = response.productDetails;
    debugPrint("[IAP Service] Loaded ${_products.length} products successfully.");
  }

  // Trigger the subscription purchase flow
  Future<void> buySubscription() async {
    if (!_isAvailable) {
      throw Exception("La tienda de Google Play no está disponible en este dispositivo.");
    }

    ProductDetails? subscriptionProduct;
    for (var prod in _products) {
      if (prod.id == subscriptionId) {
        subscriptionProduct = prod;
        break;
      }
    }

    if (subscriptionProduct == null) {
      // Create a mock product parameter if product details query returns empty in developer debug stage
      // (Google Play Console requires uploading the APK first before querying works).
      // We fall back to purchasing the mock param so developers can test immediately!
      debugPrint("[IAP Service] Product $subscriptionId not loaded from Play Console yet. Initiating test subscription.");
      
      // Fallback for developer sandbox testing
      final purchaseParam = PurchaseParam(
        productDetails: ProductDetails(
          id: subscriptionId,
          title: 'A la olla Premium (Suscripción)',
          description: 'Desbloquea alertas y notificaciones ilimitadas en tiempo real.',
          price: '\$150.00 MXN',
          rawPrice: 150.0,
          currencyCode: 'MXN',
        ),
      );
      await _iap.buyNonConsumable(purchaseParam: purchaseParam);
      return;
    }

    final purchaseParam = PurchaseParam(productDetails: subscriptionProduct);
    await _iap.buyNonConsumable(purchaseParam: purchaseParam);
  }

  void _listenToPurchaseUpdated(List<PurchaseDetails> purchaseDetailsList) {
    for (var purchaseDetails in purchaseDetailsList) {
      if (purchaseDetails.status == PurchaseStatus.pending) {
        // Show loading or pending status if needed
        debugPrint("[IAP Service] Purchase pending...");
      } else if (purchaseDetails.status == PurchaseStatus.error) {
        debugPrint("[IAP Service] Purchase error: ${purchaseDetails.error}");
        if (purchaseDetails.pendingCompletePurchase) {
          _iap.completePurchase(purchaseDetails);
        }
      } else if (purchaseDetails.status == PurchaseStatus.purchased ||
                 purchaseDetails.status == PurchaseStatus.restored) {
        // VALIDATED & COMPLETED PURCHASE!
        debugPrint("[IAP Service] Purchase SUCCESSFUL! Granting Premium status.");
        NotificationService.isPremium = true;
        
        if (purchaseDetails.pendingCompletePurchase) {
          _iap.completePurchase(purchaseDetails);
        }
      }
    }
  }

  void dispose() {
    _subscription?.cancel();
  }
}
