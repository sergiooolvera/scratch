import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/theme/app_theme.dart';
import 'package:smart_odds/presentation/providers/auth_providers.dart';
import '../../../domain/entities/alert.dart';

class AlertFeedScreen extends ConsumerStatefulWidget {
  const AlertFeedScreen({super.key});

  @override
  ConsumerState<AlertFeedScreen> createState() => _AlertFeedScreenState();
}

class _AlertFeedScreenState extends ConsumerState<AlertFeedScreen> with SingleTickerProviderStateMixin {
  bool _showSpicy = false;
  late TabController _tabController;
  final Set<String> _dismissedAlertIds = {};

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }
  void _discardAllAlerts(BuildContext context) {
    final alertsAsync = ref.read(alertsStreamProvider);
    alertsAsync.whenData((alerts) {
      final activeTab = _tabController.index;
      final listToDiscard = activeTab == 0
          ? alerts.where((a) => a.status == 'pending').toList()
          : alerts.where((a) => a.status == 'won' || a.status == 'lost').toList();

      final filteredList = listToDiscard.where((a) => !_dismissedAlertIds.contains(a.id)).toList();

      if (filteredList.isEmpty) {
        ScaffoldMessenger.of(context).clearSnackBars();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('No hay alertas para descartar en esta pestaña')),
        );
        return;
      }

      showDialog(
        context: context,
        builder: (dialogContext) {
          return AlertDialog(
            backgroundColor: AppTheme.surfaceDark,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            title: const Text('¿Descartar todas?', style: TextStyle(color: AppTheme.textLight, fontWeight: FontWeight.bold)),
            content: Text(
              '¿Deseas descartar las ${filteredList.length} alertas de esta pestaña?',
              style: const TextStyle(color: AppTheme.textMuted, fontSize: 13),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(dialogContext),
                child: const Text('Cancelar', style: TextStyle(color: AppTheme.textMuted)),
              ),
              ElevatedButton(
                onPressed: () {
                  Navigator.pop(dialogContext);
                  setState(() {
                    for (var alert in filteredList) {
                      _dismissedAlertIds.add(alert.id);
                    }
                  });
                  ScaffoldMessenger.of(context).clearSnackBars();
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Todas las alertas descartadas'),
                      duration: Duration(seconds: 2),
                      backgroundColor: AppTheme.primaryOrange,
                    ),
                  );
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.redAccent,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                ),
                child: const Text('Descartar'),
              ),
            ],
          );
        },
      );
    });
  }
  @override
  Widget build(BuildContext context) {
    final alertsAsync = ref.watch(alertsStreamProvider);

    return Scaffold(
      backgroundColor: AppTheme.backgroundDark,
      appBar: AppBar(
        title: Row(
          children: [
            const Icon(Icons.radar, color: AppTheme.primaryOrange, size: 28),
            const SizedBox(width: 10),
            Text(
              'Oportunidades',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                    letterSpacing: 0.5,
                  ),
            ),
          ],
        ),
        actions: [
          // Toggle Spicy Mode
          IconButton(
            icon: Icon(
              _showSpicy ? Icons.sentiment_very_dissatisfied : Icons.sentiment_satisfied,
              color: _showSpicy ? AppTheme.primaryOrange : AppTheme.textMuted,
            ),
            tooltip: _showSpicy ? 'Modo Irreverente Activo' : 'Modo Normal',
            onPressed: () {
              setState(() {
                _showSpicy = !_showSpicy;
              });
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(_showSpicy ? 'Modo Irreverente Activado 🌶️' : 'Modo Normal Activado'),
                  duration: const Duration(seconds: 1),
                ),
              );
            },
          ),
          IconButton(
            icon: const Icon(Icons.delete_sweep_rounded, color: Colors.redAccent),
            tooltip: 'Descartar todas',
            onPressed: () => _discardAllAlerts(context),
          ),
          IconButton(
            icon: const Icon(Icons.info_outline_rounded, color: AppTheme.textMuted),
            onPressed: () => _showInfoDialog(context),
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: AppTheme.primaryOrange,
          labelColor: AppTheme.primaryOrange,
          unselectedLabelColor: AppTheme.textMuted,
          tabs: const [
            Tab(text: 'ACTIVAS'),
            Tab(text: 'HISTORIAL'),
          ],
        ),
      ),
      body: alertsAsync.when(
        data: (alerts) {
          if (alerts.isEmpty) {
            return _buildEmptyState(context);
          }

          // Filter alerts based on tabs
          final activeAlerts = alerts.where((a) => a.status == 'pending').toList();
          final historyAlerts = alerts.where((a) => a.status == 'won' || a.status == 'lost').toList();

          return TabBarView(
            controller: _tabController,
            children: [
              _buildAlertList(context, activeAlerts),
              _buildAlertList(context, historyAlerts),
            ],
          );
        },
        loading: () => const Center(
          child: CircularProgressIndicator(color: AppTheme.primaryOrange),
        ),
        error: (err, stack) => _buildErrorState(context, err.toString()),
      ),
    );
  }

  Widget _buildAlertList(BuildContext context, List<Alert> alerts) {
    final filteredAlerts = alerts.where((a) => !_dismissedAlertIds.contains(a.id)).toList();

    if (filteredAlerts.isEmpty) {
      return Center(
        child: Text(
          'No hay alertas en esta categoría',
          style: TextStyle(color: AppTheme.textMuted),
        ),
      );
    }
    return RefreshIndicator(
      onRefresh: () async {
        ref.invalidate(alertsStreamProvider);
      },
      color: AppTheme.primaryOrange,
      backgroundColor: AppTheme.surfaceDark,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: filteredAlerts.length,
        itemBuilder: (context, index) {
          final alert = filteredAlerts[index];
          return Dismissible(
            key: Key(alert.id),
            direction: DismissDirection.endToStart,
            background: Container(
              margin: const EdgeInsets.symmetric(vertical: 8),
              decoration: BoxDecoration(
                color: Colors.redAccent.withOpacity(0.8),
                borderRadius: BorderRadius.circular(16),
              ),
              alignment: Alignment.centerRight,
              padding: const EdgeInsets.only(right: 20.0),
              child: const Icon(Icons.delete_sweep_rounded, color: Colors.white, size: 32),
            ),
            onDismissed: (direction) {
              setState(() {
                _dismissedAlertIds.add(alert.id);
              });
              final messenger = ScaffoldMessenger.of(context);
              messenger.clearSnackBars();
              messenger.showSnackBar(
                SnackBar(
                  content: const Text('Alerta descartada'),
                  duration: const Duration(days: 1), // workaround: forzamos cierre manual
                  action: SnackBarAction(
                    label: 'Deshacer',
                    textColor: AppTheme.primaryOrange,
                    onPressed: () {
                      messenger.hideCurrentSnackBar();
                      setState(() {
                        _dismissedAlertIds.remove(alert.id);
                      });
                    },
                  ),
                ),
              );
              // Flutter Web ignora `duration` con action — forzamos cierre manual
              Future.delayed(const Duration(seconds: 3), () {
                messenger.hideCurrentSnackBar();
              });
            },
            child: _buildAlertCard(context, alert),
          );
        },
      ),
    );
  }

  Widget _buildAlertCard(BuildContext context, Alert alert) {
    Color marketColor;
    IconData marketIcon;
    switch (alert.market.toLowerCase()) {
      case 'corners':
        marketColor = Colors.cyanAccent;
        marketIcon = Icons.flag_rounded;
        break;
      case 'goals':
      case 'heavypressure':
        marketColor = Colors.lightGreenAccent;
        marketIcon = Icons.sports_soccer_rounded;
        break;
      case 'yellow_cards':
        marketColor = Colors.amberAccent;
        marketIcon = Icons.style_rounded;
        break;
      case 'redcard':
      case 'red_cards':
        marketColor = Colors.redAccent;
        marketIcon = Icons.warning_amber_rounded;
        break;
      default:
        marketColor = AppTheme.primaryOrange;
        marketIcon = Icons.stars_rounded;
    }

    // Determine description based on mode
    String description = alert.description;
    if (_showSpicy && alert.descriptionSpicy != null && alert.descriptionSpicy!.isNotEmpty) {
      description = alert.descriptionSpicy!;
    }

    // Status Badge
    Widget statusBadge = SizedBox.shrink();
    if (alert.status == 'won') {
      statusBadge = _buildBadge('GANADA', Colors.green);
    } else if (alert.status == 'lost') {
      statusBadge = _buildBadge('PERDIDA', Colors.red);
    }

    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: alert.isSafe ? AppTheme.primaryOrange.withOpacity(0.5) : marketColor.withOpacity(0.12),
            width: alert.isSafe ? 2 : 1,
          ),
          gradient: LinearGradient(
            colors: [
              AppTheme.surfaceCard,
              AppTheme.surfaceDark.withOpacity(0.5),
            ],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          boxShadow: alert.isSafe
              ? [
                  BoxShadow(
                    color: AppTheme.primaryOrange.withOpacity(0.1),
                    blurRadius: 10,
                    spreadRadius: 2,
                  )
                ]
              : null,
        ),
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: marketColor.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(marketIcon, color: marketColor, size: 14),
                        const SizedBox(width: 4),
                        Text(
                          alert.market.toUpperCase(),
                          style: TextStyle(
                            color: marketColor,
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 1,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Row(
                    children: [
                      statusBadge,
                      const SizedBox(width: 8),
                      const Icon(Icons.timer_outlined, color: AppTheme.textMuted, size: 14),
                      const SizedBox(width: 4),
                      Text(
                        "${alert.minute}'",
                        style: const TextStyle(
                          color: AppTheme.textMuted,
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 12),

              Text(
                "${alert.homeTeam} vs ${alert.awayTeam}",
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: AppTheme.textLight,
                ),
              ),
              const SizedBox(height: 4),

              Text(
                "Marcador: ${alert.score}",
                style: const TextStyle(
                  fontSize: 12,
                  color: AppTheme.textMuted,
                  fontWeight: FontWeight.w500,
                ),
              ),
              const SizedBox(height: 12),

              Divider(color: Colors.white.withOpacity(0.05)),
              const SizedBox(height: 8),

              Text(
                description,
                style: const TextStyle(
                  fontSize: 13,
                  color: AppTheme.textLight,
                  height: 1.4,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildBadge(String text, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: color.withOpacity(0.15),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        text,
        style: TextStyle(color: color, fontSize: 10, fontWeight: FontWeight.bold),
      ),
    );
  }

  Widget _buildStatItem(String label, String source, String value, Color color, {bool glowing = false}) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(8),
        margin: const EdgeInsets.symmetric(horizontal: 4),
        decoration: BoxDecoration(
          color: Colors.black.withOpacity(0.2),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
            color: glowing ? color.withOpacity(0.2) : Colors.transparent,
            width: 1,
          ),
        ),
        child: Column(
          children: [
            Text(
              label,
              style: TextStyle(color: color, fontSize: 9, fontWeight: FontWeight.bold, letterSpacing: 0.5),
            ),
            const SizedBox(height: 2),
            Text(
              value,
              style: TextStyle(
                color: color,
                fontSize: 16,
                fontWeight: FontWeight.bold,
                shadows: glowing
                    ? [
                        Shadow(color: color.withOpacity(0.5), blurRadius: 10),
                      ]
                    : null,
              ),
            ),
            const SizedBox(height: 1),
            Text(
              source,
              style: const TextStyle(color: AppTheme.textMuted, fontSize: 8),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.notifications_none_rounded, size: 72, color: AppTheme.textMuted),
            const SizedBox(height: 16),
            Text(
              'No hay alertas activas',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            const Text(
              'El orquestador está monitoreando partidos en vivo. Recibirás una notificación push en cuanto detectemos una oportunidad de valor.',
              style: TextStyle(color: AppTheme.textMuted, fontSize: 13, height: 1.4),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildErrorState(BuildContext context, String error) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.wifi_off_rounded, size: 64, color: Colors.red),
            const SizedBox(height: 16),
            const Text(
              'Error de Conexión',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text(
              error,
              style: const TextStyle(color: AppTheme.textMuted, fontSize: 13),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  void _showInfoDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          backgroundColor: AppTheme.surfaceDark,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          title: const Text('¿Cómo funciona?', style: TextStyle(color: AppTheme.textLight, fontWeight: FontWeight.bold)),
          content: const Text(
            'El sistema extrae las estadísticas en tiempo real y los momios actuales de las mejores casas de apuestas.\n\n'
            'A través de fórmulas matemáticas basadas en distribución de Poisson y factores bayesianos, comparamos la probabilidad real con la probabilidad del momio. Si detectamos un sesgo favorable (+EV) mayor al 5%, se dispara una alerta instantánea.\n\n'
            '🌶️ MODOS DE ALERTA:\n'
            '• Modo Normal: Muestra una explicación clara, objetiva y estadística de por qué el partido es de valor.\n'
            '• Modo Irreverente: ¡Agrega sazón a las apuestas! Te explica la jugada con descripciones ácidas, graciosas y llenas de actitud para divertirte mientras juegas.\n\n'
            '⚠️ RECORDATORIO: Las alertas son meras recomendaciones estadísticas. El usuario es responsable de su gestión de banca (Bankroll) y de sus decisiones. No apuestes dinero que no estés dispuesto a perder.',
            style: TextStyle(color: AppTheme.textLight, fontSize: 13, height: 1.4),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Entendido', style: TextStyle(color: AppTheme.accentOrange, fontWeight: FontWeight.bold)),
            ),
          ],
        );
      },
    );
  }
}
