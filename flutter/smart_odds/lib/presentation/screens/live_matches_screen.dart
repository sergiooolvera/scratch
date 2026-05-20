import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/theme/app_theme.dart';
import 'package:smart_odds/presentation/providers/auth_providers.dart';
import '../../../domain/entities/live_match.dart';

class LiveMatchesScreen extends ConsumerWidget {
  const LiveMatchesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final matchesAsync = ref.watch(liveMatchesStreamProvider);

    return Scaffold(
      backgroundColor: AppTheme.backgroundDark,
      appBar: AppBar(
        title: Row(
          children: [
            const Icon(Icons.sports_soccer_rounded, color: AppTheme.primaryOrange, size: 28),
            const SizedBox(width: 10),
            Text(
              'Partidos en Vivo',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                    letterSpacing: 0.5,
                  ),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.delete_sweep_rounded, color: Colors.redAccent),
            tooltip: 'Eliminar todos',
            onPressed: () => _deleteAllLiveMatches(context, ref),
          ),
        ],
      ),
      body: matchesAsync.when(
        data: (matches) {
          // Filter out finished matches (minute > 95) and matches with "unknown" or empty team names
          final filteredMatches = matches.where((match) {
            final isFinished = match.minute > 95;
            final isUnknownHome = match.homeTeam.toLowerCase() == 'unknown' || match.homeTeam.isEmpty;
            final isUnknownAway = match.awayTeam.toLowerCase() == 'unknown' || match.awayTeam.isEmpty;
            return !isFinished && !isUnknownHome && !isUnknownAway;
          }).toList();

          if (filteredMatches.isEmpty) {
            return _buildEmptyState(context);
          }
          return RefreshIndicator(
            onRefresh: () async {
              ref.invalidate(liveMatchesStreamProvider);
            },
            color: AppTheme.primaryOrange,
            backgroundColor: AppTheme.surfaceDark,
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: filteredMatches.length,
              itemBuilder: (context, index) {
                final match = filteredMatches[index];
                return _buildMatchCard(context, ref, match);
              },
            ),
          );
        },
        loading: () => const Center(
          child: CircularProgressIndicator(color: AppTheme.primaryOrange),
        ),
        error: (err, stack) => _buildErrorState(context, err.toString()),
      ),
    );
  }

  Widget _buildMatchCard(BuildContext context, WidgetRef ref, LiveMatch match) {
    final stats = match.liveStats;
    final cornersTotal = stats['corners_total'] ?? 0;
    final dangerousAttacksHome = stats['dangerous_attacks_home'] ?? 0;
    final dangerousAttacksAway = stats['dangerous_attacks_away'] ?? 0;
    final cardsTotal = stats['yellow_cards_total'] ?? 0;

    // Estimate total attacks for simple percentage indicator
    final totalAttacks = dangerousAttacksHome + dangerousAttacksAway;
    final homeAttackPct = totalAttacks > 0 ? (dangerousAttacksHome / totalAttacks) : 0.5;

    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: Colors.white.withOpacity(0.04),
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Row: Match Status / Minute & Simulation Tag
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                if (match.isSimulated)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(
                      color: AppTheme.primaryOrange.withOpacity(0.15),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: const Text(
                      "SIMULACIÓN",
                      style: TextStyle(color: AppTheme.primaryOrange, fontSize: 8, fontWeight: FontWeight.bold),
                    ),
                  )
                else
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(
                      color: Colors.green.withOpacity(0.15),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: const Text(
                      "PARTIDOS EN VIVO",
                      style: TextStyle(color: Colors.green, fontSize: 8, fontWeight: FontWeight.bold),
                    ),
                  ),
                Row(
                  children: [
                    const Icon(Icons.flash_on, color: AppTheme.accentOrange, size: 14),
                    const SizedBox(width: 4),
                    Text(
                      "${match.minute}'",
                      style: const TextStyle(color: AppTheme.accentOrange, fontWeight: FontWeight.bold, fontSize: 13),
                    ),
                    const SizedBox(width: 12),
                    IconButton(
                      icon: const Icon(Icons.delete_outline_rounded, color: Colors.redAccent, size: 18),
                      padding: EdgeInsets.zero,
                      constraints: const BoxConstraints(),
                      onPressed: () => _confirmDeleteMatch(context, ref, match),
                    ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 12),

            // Scoreboard UI (Main banner)
            Row(
              children: [
                Expanded(
                  child: Text(
                    match.homeTeam,
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: AppTheme.textLight),
                    textAlign: TextAlign.end,
                  ),
                ),
                Container(
                  margin: const EdgeInsets.symmetric(horizontal: 16),
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: Colors.black.withOpacity(0.3),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Text(
                    "${match.scoreHome} - ${match.scoreAway}",
                    style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.primaryOrange),
                  ),
                ),
                Expanded(
                  child: Text(
                    match.awayTeam,
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: AppTheme.textLight),
                    textAlign: TextAlign.start,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),

            // STATS VISUALIZATION PANEL
            const Text(
              "ESTADÍSTICAS EN VIVO",
              style: TextStyle(color: AppTheme.textMuted, fontSize: 9, fontWeight: FontWeight.bold, letterSpacing: 0.8),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),

            // Stat 1: Corners
            _buildStatProgressBar(
              context,
              "Tiros de Esquina",
              "${stats['corners_home'] ?? 0}",
              "${stats['corners_away'] ?? 0}",
              (stats['corners_home'] ?? 0) + (stats['corners_away'] ?? 0) > 0
                  ? (stats['corners_home'] ?? 0) / ((stats['corners_home'] ?? 0) + (stats['corners_away'] ?? 0))
                  : 0.5,
              Colors.cyanAccent,
            ),
            const SizedBox(height: 12),

            // Stat 2: Dangerous Attacks
            _buildStatProgressBar(
              context,
              "Ataques Peligrosos",
              "$dangerousAttacksHome",
              "$dangerousAttacksAway",
              homeAttackPct,
              Colors.orangeAccent,
            ),
            const SizedBox(height: 12),

            // Card statistics
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.style_rounded, color: Colors.amberAccent, size: 14),
                const SizedBox(width: 4),
                Text(
                  "Tarjetas Amarillas: $cardsTotal",
                  style: const TextStyle(color: AppTheme.textMuted, fontSize: 11),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatProgressBar(
    BuildContext context,
    String title,
    String homeVal,
    String awayVal,
    double ratio,
    Color activeColor,
  ) {
    return Column(
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(homeVal, style: TextStyle(fontWeight: FontWeight.bold, color: activeColor, fontSize: 12)),
            Text(title, style: const TextStyle(color: AppTheme.textMuted, fontSize: 10)),
            Text(awayVal, style: TextStyle(fontWeight: FontWeight.bold, color: activeColor, fontSize: 12)),
          ],
        ),
        const SizedBox(height: 4),
        ClipRRect(
          borderRadius: BorderRadius.circular(10),
          child: SizedBox(
            height: 6,
            child: LinearProgressIndicator(
              value: ratio,
              backgroundColor: Colors.white.withOpacity(0.05),
              color: activeColor,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildEmptyState(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.sports_soccer, size: 72, color: AppTheme.textMuted),
            const SizedBox(height: 16),
            Text(
              'No hay partidos en curso',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            const Text(
              'El orquestador no detecta partidos activos en vivo ni simulaciones en ejecución.',
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
            const Icon(Icons.error_outline_rounded, size: 64, color: Colors.red),
            const SizedBox(height: 16),
            const Text(
              'Ocurrió un error',
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

  void _confirmDeleteMatch(BuildContext context, WidgetRef ref, LiveMatch match) {
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          backgroundColor: AppTheme.surfaceDark,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          title: const Text('¿Eliminar partido?', style: TextStyle(color: AppTheme.textLight, fontWeight: FontWeight.bold)),
          content: Text(
            '¿Deseas eliminar permanentemente la tarjeta de ${match.homeTeam} vs ${match.awayTeam}? Esto lo borrará también de la base de datos.',
            style: const TextStyle(color: AppTheme.textMuted, fontSize: 13, height: 1.4),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancelar', style: TextStyle(color: AppTheme.textMuted)),
            ),
            ElevatedButton(
              onPressed: () async {
                Navigator.pop(context);
                try {
                  await ref.read(firestoreServiceProvider).deleteLiveMatch(match.id);
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).clearSnackBars();
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Partido eliminado de la base de datos'),
                        backgroundColor: Colors.green,
                        duration: Duration(seconds: 2),
                      ),
                    );
                  }
                } catch (e) {
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text('Error al eliminar: $e'),
                        backgroundColor: Colors.red,
                        duration: const Duration(seconds: 2),
                      ),
                    );
                  }
                }
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.redAccent,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
              ),
              child: const Text('Eliminar'),
            ),
          ],
        );
      },
    );
  }

  void _deleteAllLiveMatches(BuildContext context, WidgetRef ref) {
    final matchesAsync = ref.read(liveMatchesStreamProvider);
    matchesAsync.whenData((matches) {
      final filteredMatches = matches.where((match) {
        final isFinished = match.minute > 95;
        final isUnknownHome = match.homeTeam.toLowerCase() == 'unknown' || match.homeTeam.isEmpty;
        final isUnknownAway = match.awayTeam.toLowerCase() == 'unknown' || match.awayTeam.isEmpty;
        return !isFinished && !isUnknownHome && !isUnknownAway;
      }).toList();

      if (filteredMatches.isEmpty) {
        ScaffoldMessenger.of(context).clearSnackBars();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('No hay partidos activos para eliminar')),
        );
        return;
      }

      showDialog(
        context: context,
        builder: (dialogContext) {
          return AlertDialog(
            backgroundColor: AppTheme.surfaceDark,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            title: const Text('¿Eliminar todos?', style: TextStyle(color: AppTheme.textLight, fontWeight: FontWeight.bold)),
            content: Text(
              '¿Deseas eliminar permanentemente los ${filteredMatches.length} partidos activos de la base de datos Firestore?',
              style: const TextStyle(color: AppTheme.textMuted, fontSize: 13, height: 1.4),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(dialogContext),
                child: const Text('Cancelar', style: TextStyle(color: AppTheme.textMuted)),
              ),
              ElevatedButton(
                onPressed: () async {
                  Navigator.pop(dialogContext);
                  try {
                    for (var match in filteredMatches) {
                      await ref.read(firestoreServiceProvider).deleteLiveMatch(match.id);
                    }
                    ScaffoldMessenger.of(context).clearSnackBars();
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Todos los partidos eliminados exitosamente'),
                        backgroundColor: Colors.green,
                        duration: Duration(seconds: 2),
                      ),
                    );
                  } catch (e) {
                    ScaffoldMessenger.of(context).clearSnackBars();
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text('Error al eliminar partidos: $e'),
                        backgroundColor: Colors.red,
                        duration: const Duration(seconds: 2),
                      ),
                    );
                  }
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.redAccent,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                ),
                child: const Text('Eliminar todos'),
              ),
            ],
          );
        },
      );
    });
  }
}
