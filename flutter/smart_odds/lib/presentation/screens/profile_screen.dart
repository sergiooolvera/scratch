import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:dio/dio.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../core/theme/app_theme.dart';
import 'package:smart_odds/presentation/providers/auth_providers.dart';
import '../../core/services/notification_service.dart';
import '../../core/services/iap_service.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/services.dart';

class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key});

  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> {
  final Dio _dio = Dio();
  // Configurable backend API. 
  // 'http://10.0.2.2:8000' is the standard bridge address to connect Android Emulator to local host.
  // We can let the user change this if they deploy to Railway!
  String _apiBaseUrl = "https://cheerful-appreciation-production-c36d.up.railway.app"; 
  bool _actionLoading = false;
  String _simulationMessage = "Sin simulaciones activas";
  String? _activeSimId;

  @override
  void initState() {
    super.initState();
  }

  Future<void> _triggerSimulation(String scenario) async {
    setState(() {
      _actionLoading = true;
      _simulationMessage = "Iniciando simulación...";
    });

    try {
      final response = await _dio.post(
        "$_apiBaseUrl/simulation/start",
        queryParameters: {"scenario": scenario},
      );

      if (response.statusCode == 200) {
        final data = response.data;
        _activeSimId = data["match_id"];
        setState(() {
          _simulationMessage = "Simulación activa ID: $_activeSimId\nEscenario: ${scenario.toUpperCase()}";
        });
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text("Simulación '$scenario' iniciada exitosamente!"),
            backgroundColor: AppTheme.primaryOrange,
          ),
        );
      }
    } catch (e) {
      setState(() {
        _simulationMessage = "Error de conexión. Revisa la URL.";
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text("Error: No se pudo conectar al backend en $_apiBaseUrl. ¿Está corriendo el servidor Python?"),
          backgroundColor: Colors.red,
          duration: const Duration(seconds: 4),
        ),
      );
    } finally {
      setState(() => _actionLoading = false);
    }
  }

  Future<void> _stopSimulations() async {
    if (_activeSimId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("No hay simulaciones registradas para detener.")),
      );
      return;
    }

    setState(() => _actionLoading = true);
    try {
      final response = await _dio.post(
        "$_apiBaseUrl/simulation/stop",
        queryParameters: {"match_id": _activeSimId},
      );

      if (response.statusCode == 200) {
        _activeSimId = null;
        setState(() {
          _simulationMessage = "Todas las simulaciones se detuvieron.";
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text("Simulación detenida."), backgroundColor: Colors.green),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Error al detener simulación."), backgroundColor: Colors.red),
      );
    } finally {
      setState(() => _actionLoading = false);
    }
  }

  Future<void> _toggleRealOrchestrator(bool start) async {
    setState(() => _actionLoading = true);
    final endpoint = start ? "start" : "stop";
    try {
      final response = await _dio.post("$_apiBaseUrl/orchestrator/$endpoint");
      if (response.statusCode == 200) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(start ? "Orquestador Real INICIADO" : "Orquestador Real DETENIDO"),
            backgroundColor: start ? Colors.green : Colors.orange,
          ),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text("Error al conectar con $_apiBaseUrl"), backgroundColor: Colors.red),
      );
    } finally {
      setState(() => _actionLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final userStateVal = ref.watch(userAuthenticatedProvider);
    final email = userStateVal?.email ?? 'invitado@alaolla.com';

    return Scaffold(
      backgroundColor: AppTheme.backgroundDark,
      appBar: AppBar(
        title: const Text('Ajustes', style: TextStyle(fontWeight: FontWeight.bold)),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // User profile header card
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Row(
                  children: [
                    const CircleAvatar(
                      backgroundColor: AppTheme.primaryOrange,
                      radius: 28,
                      child: Icon(Icons.person, color: Colors.white, size: 28),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            "Usuario A la olla",
                            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: AppTheme.textLight),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            email,
                            style: const TextStyle(color: AppTheme.textMuted, fontSize: 13),
                          ),
                          const SizedBox(height: 8),
                          // Referral Code Display
                          if (kIsWeb || !isFirebaseEnabled)
                            const Text('Código: MOCK_WEB_CODE', style: TextStyle(color: AppTheme.primaryOrange, fontSize: 13, fontWeight: FontWeight.bold))
                          else
                            FutureBuilder<DocumentSnapshot>(
                              future: FirebaseFirestore.instance.collection('users').doc(userStateVal?.uid).get(),
                            builder: (context, snapshot) {
                              if (snapshot.connectionState == ConnectionState.waiting) {
                                return const Text('Cargando código...', style: TextStyle(color: AppTheme.textMuted, fontSize: 13));
                              }
                              if (snapshot.hasData && snapshot.data!.exists) {
                                final data = snapshot.data!.data() as Map<String, dynamic>;
                                final code = data['referralCode'] ?? 'Sin código';
                                return Row(
                                  children: [
                                    Text(
                                      'Código: $code',
                                      style: const TextStyle(color: AppTheme.primaryOrange, fontSize: 13, fontWeight: FontWeight.bold),
                                    ),
                                    const SizedBox(width: 4),
                                    InkWell(
                                      onTap: () {
                                        Clipboard.setData(ClipboardData(text: code));
                                        ScaffoldMessenger.of(context).showSnackBar(
                                          const SnackBar(content: Text('Código copiado al portapapeles'), backgroundColor: AppTheme.primaryOrange),
                                        );
                                      },
                                      child: const Icon(Icons.copy, size: 16, color: AppTheme.textMuted),
                                    ),
                                  ],
                                );
                              }
                              return const Text('Sin código', style: TextStyle(color: AppTheme.textMuted, fontSize: 13));
                            },
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),

            // MODO DE COBRO (PLAN)
            const Row(
              children: [
                Icon(Icons.monetization_on_outlined, color: Colors.amber, size: 20),
                SizedBox(width: 8),
                Text(
                  "MODO DE LA APP",
                  style: TextStyle(fontWeight: FontWeight.bold, color: Colors.amber, fontSize: 12, letterSpacing: 0.5),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Card(
              child: Column(
                children: [
                  ListTile(
                    leading: Icon(
                      NotificationService.isPremium 
                          ? Icons.workspace_premium_rounded 
                          : Icons.lock_rounded,
                      color: NotificationService.isPremium ? Colors.amber : AppTheme.textMuted,
                      size: 24,
                    ),
                    title: Text(
                      NotificationService.isPremium 
                          ? "Membresía Premium Activa" 
                          : "Plan Gratuito", 
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: AppTheme.textLight),
                    ),
                    subtitle: Text(
                      NotificationService.isPremium 
                          ? "Disfrutas de alertas ilimitadas en tiempo real y feed completo." 
                          : "Limitado a 3 alertas diarias, sin destacar seguras.", 
                      style: const TextStyle(fontSize: 11, color: AppTheme.textMuted),
                    ),
                    trailing: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: NotificationService.isPremium 
                            ? Colors.amber.withOpacity(0.15) 
                            : Colors.white10,
                        borderRadius: BorderRadius.circular(6),
                        border: Border.all(
                          color: NotificationService.isPremium 
                              ? Colors.amber 
                              : Colors.white24,
                          width: 1,
                        ),
                      ),
                      child: Text(
                        NotificationService.isPremium ? "PREMIUM" : "GRATIS",
                        style: TextStyle(
                          fontSize: 10, 
                          fontWeight: FontWeight.bold, 
                          color: NotificationService.isPremium ? Colors.amber : AppTheme.textMuted,
                        ),
                      ),
                    ),
                  ),
                  const Divider(height: 1, color: Colors.white10),
                  Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        if (!NotificationService.isPremium) ...[
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Text("Costo del Premium:", style: TextStyle(color: AppTheme.textMuted, fontSize: 13)),
                              if (kIsWeb || !isFirebaseEnabled)
                                const Text(
                                  "\$300.00 MXN / mes",
                                  style: TextStyle(color: Colors.amber, fontWeight: FontWeight.bold, fontSize: 14),
                                )
                              else
                                FutureBuilder<DocumentSnapshot>(
                                  future: FirebaseFirestore.instance.collection('config').doc('premium').get(),
                                  builder: (context, snapshot) {
                                    int price = 300;
                                    if (snapshot.hasData && snapshot.data!.exists) {
                                      final data = snapshot.data!.data() as Map<String, dynamic>;
                                      price = data['price'] ?? 300;
                                    }
                                    return Text(
                                      "\$$price.00 MXN / mes",
                                      style: const TextStyle(color: Colors.amber, fontWeight: FontWeight.bold, fontSize: 14),
                                    );
                                  },
                                ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          ElevatedButton.icon(
                            onPressed: () async {
                              if (kIsWeb) {
                                // Simular compra en Web para pruebas
                                showDialog(
                                  context: context,
                                  builder: (context) => AlertDialog(
                                    backgroundColor: AppTheme.surfaceCard,
                                    title: Row(
                                      children: [
                                        Image.asset('assets/google_logo.png', width: 24, height: 24),
                                        const SizedBox(width: 10),
                                        const Text('Google Play Billing', style: TextStyle(color: Colors.white, fontSize: 16)),
                                      ],
                                    ),
                                    content: const Column(
                                      mainAxisSize: MainAxisSize.min,
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text('Smart Odds Premium (Suscripción)', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15)),
                                        SizedBox(height: 4),
                                        Text('Acceso ilimitado a alertas y feed (+EV)', style: TextStyle(color: AppTheme.textMuted, fontSize: 12)),
                                        SizedBox(height: 16),
                                        Row(
                                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                          children: [
                                            Text('Precio:', style: TextStyle(color: AppTheme.textMuted, fontSize: 13)),
                                            Text('\$300.00 MXN / mes', style: TextStyle(color: Colors.amber, fontWeight: FontWeight.bold, fontSize: 14)),
                                          ],
                                        ),
                                      ],
                                    ),
                                    actions: [
                                      TextButton(
                                        onPressed: () => Navigator.pop(context),
                                        child: const Text('Cancelar', style: TextStyle(color: AppTheme.textMuted)),
                                      ),
                                      ElevatedButton(
                                        style: ElevatedButton.styleFrom(backgroundColor: Colors.amber, foregroundColor: Colors.black),
                                        onPressed: () {
                                          Navigator.pop(context);
                                          setState(() {
                                            NotificationService.isPremium = true;
                                          });
                                          ScaffoldMessenger.of(context).clearSnackBars();
                                          ScaffoldMessenger.of(context).showSnackBar(
                                            const SnackBar(
                                              content: Text('¡Suscripción Simulada con Éxito! Modo Premium Activado 🔓'),
                                              backgroundColor: Colors.amber,
                                            ),
                                          );
                                        },
                                        child: const Text('Suscribirse'),
                                      ),
                                    ],
                                  ),
                                );
                              } else {
                                // Flujo Real en Android
                                ScaffoldMessenger.of(context).clearSnackBars();
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(
                                    content: Text('Conectando con Google Play Store...'),
                                    backgroundColor: Colors.amber,
                                  ),
                                );
                                try {
                                  await IAPService.instance.buySubscription();
                                } catch (e) {
                                  ScaffoldMessenger.of(context).clearSnackBars();
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(
                                      content: Text('Error Play Store: ${e.toString()}'),
                                      backgroundColor: Colors.red,
                                    ),
                                  );
                                }
                              }
                            },
                            icon: const Icon(Icons.play_arrow_rounded, size: 16, color: Colors.black),
                            label: const Text("Suscribirse con Google Play", style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Colors.black)),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.amber,
                              foregroundColor: Colors.black,
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                              padding: const EdgeInsets.symmetric(vertical: 12),
                            ),
                          ),
                        ] else ...[
                          Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Icon(Icons.check_circle_rounded, color: Colors.amber, size: 18),
                              const SizedBox(width: 8),
                              const Text(
                                "Gracias por tu apoyo. Tu suscripción está activa.",
                                style: TextStyle(color: Colors.amber, fontSize: 12, fontWeight: FontWeight.w500),
                              ),
                            ],
                          ),
                          if (kIsWeb) ...[
                            const SizedBox(height: 12),
                            OutlinedButton.icon(
                              onPressed: () {
                                setState(() {
                                  NotificationService.isPremium = false;
                                });
                                ScaffoldMessenger.of(context).clearSnackBars();
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(
                                    content: Text('Suscripción simulada cancelada para pruebas.'),
                                    backgroundColor: Colors.redAccent,
                                  ),
                                );
                              },
                              icon: const Icon(Icons.cancel_rounded, size: 16, color: Colors.redAccent),
                              label: const Text("Cancelar Simulación (Pruebas)", style: TextStyle(fontSize: 12, color: Colors.redAccent)),
                              style: OutlinedButton.styleFrom(
                                side: const BorderSide(color: Colors.redAccent),
                                padding: const EdgeInsets.symmetric(vertical: 10),
                              ),
                            ),
                          ],
                        ],
                      ],
                    ),
                  ),
                ],
              ),
            ),
            if (email == 'sergio.olver@gmail.com') ...[
              const SizedBox(height: 32),

              // SIMULATION CENTER TITLE
              const Row(
                children: [
                  Icon(Icons.science_outlined, color: AppTheme.primaryOrange, size: 20),
                  SizedBox(width: 8),
                  Text(
                    "CENTRO DE SIMULACIÓN",
                    style: TextStyle(fontWeight: FontWeight.bold, color: AppTheme.primaryOrange, fontSize: 12, letterSpacing: 0.5),
                  ),
                ],
              ),
              const SizedBox(height: 8),

              // Server URL configuration field
              TextField(
                controller: TextEditingController(text: _apiBaseUrl),
                onChanged: (val) => _apiBaseUrl = val.trim(),
                style: const TextStyle(color: AppTheme.textLight, fontSize: 13),
                decoration: InputDecoration(
                  labelText: 'URL del Servidor Python',
                  labelStyle: const TextStyle(color: AppTheme.textMuted),
                  prefixIcon: const Icon(Icons.dns_outlined, color: AppTheme.textMuted, size: 18),
                  filled: true,
                  fillColor: AppTheme.surfaceDark,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                ),
              ),
              const SizedBox(height: 16),

              // Simulation Status Card
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.black.withOpacity(0.25),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.white.withOpacity(0.04)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const Text(
                      "ESTADO DE SIMULACIÓN",
                      style: TextStyle(color: AppTheme.textMuted, fontSize: 9, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      _simulationMessage,
                      style: const TextStyle(color: AppTheme.textLight, fontSize: 13, height: 1.4),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // Interactive simulation buttons
              ElevatedButton.icon(
                onPressed: _actionLoading ? null : () => _triggerSimulation("corner_drought"),
                icon: const Icon(Icons.flag_outlined, size: 18),
                label: const Text("Simular Sequía de Córners", style: TextStyle(fontWeight: FontWeight.bold)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primaryOrange,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
              const SizedBox(height: 12),

              ElevatedButton.icon(
                onPressed: _actionLoading ? null : () => _triggerSimulation("late_storm"),
                icon: const Icon(Icons.flash_on_outlined, size: 18),
                label: const Text("Simular Tormenta Ofensiva", style: TextStyle(fontWeight: FontWeight.bold)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primaryOrange,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
              const SizedBox(height: 12),

              OutlinedButton.icon(
                onPressed: _actionLoading ? null : _stopSimulations,
                icon: const Icon(Icons.stop_circle_outlined, size: 18, color: Colors.red),
                label: const Text("Detener Simulaciones", style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold)),
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  side: const BorderSide(color: Colors.red),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
              const SizedBox(height: 32),

              // REAL POLLING SECTION
              const Row(
                children: [
                  Icon(Icons.online_prediction_rounded, color: Colors.green, size: 20),
                  SizedBox(width: 8),
                  Text(
                    "MODO REAL (EN VIVO)",
                    style: TextStyle(fontWeight: FontWeight.bold, color: Colors.green, fontSize: 12, letterSpacing: 0.5),
                  ),
                ],
              ),
              const SizedBox(height: 12),

              Row(
                children: [
                  Expanded(
                    child: ElevatedButton(
                      onPressed: _actionLoading ? null : () => _toggleRealOrchestrator(true),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.green,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: const Text("Iniciar", style: TextStyle(fontWeight: FontWeight.bold)),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: OutlinedButton(
                      onPressed: _actionLoading ? null : () => _toggleRealOrchestrator(false),
                      style: OutlinedButton.styleFrom(
                        side: const BorderSide(color: AppTheme.textMuted),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: const Text("Detener", style: TextStyle(color: AppTheme.textLight)),
                    ),
                  ),
                ],
              ),
            ],
            const SizedBox(height: 48),

            // Logout Button
            TextButton.icon(
              onPressed: () {
                ref.read(authRepositoryProvider).signOut();
                context.go('/login');
              },
              icon: const Icon(Icons.logout_rounded, color: Colors.red, size: 18),
              label: const Text("Cerrar Sesión", style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold)),
            ),
          ],
        ),
      ),
    );
  }
}
