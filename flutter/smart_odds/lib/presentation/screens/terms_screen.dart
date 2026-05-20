import 'package:flutter/material.dart';
import '../../core/theme/app_theme.dart';

class TermsScreen extends StatelessWidget {
  const TermsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundDark,
      appBar: AppBar(
        title: const Text('Términos y Condiciones'),
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: AppTheme.textLight, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Text(
                'Términos y Condiciones de Uso',
                style: TextStyle(
                  color: AppTheme.textLight,
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'Última actualización: Mayo 2026',
                style: TextStyle(
                  color: AppTheme.textMuted,
                  fontSize: 12,
                ),
              ),
              const SizedBox(height: 24),
              _buildSection(
                '1. Aceptación de los Términos',
                'Al descargar, instalar y utilizar la aplicación "A la olla", usted acepta de manera expresa todos los términos y condiciones estipulados en este documento. Si no está de acuerdo con alguno de ellos, por favor absténgase de usar este servicio.',
              ),
              _buildSection(
                '2. Requisito de Edad',
                'El uso de este servicio está estrictamente limitado a personas mayores de 18 años con plena capacidad legal. La aplicación no promueve apuestas directas ni capta dinero de juego de menores de edad.',
              ),
              _buildSection(
                '3. Naturaleza del Servicio',
                'A la olla proporciona exclusivamente análisis estadísticos en tiempo real e indicadores de valor (+EV) basados en modelos matemáticos y distribuciones probabilísticas (Poisson y factores bayesianos). Todas las alertas son únicamente sugerencias informativas e instructivas basadas en algoritmos.',
              ),
              _buildSection(
                '4. Exclusión de Responsabilidad (No Consejo Financiero)',
                'La aplicación NO garantiza ningún resultado específico ni rentabilidad en apuestas deportivas. El usuario asume toda la responsabilidad civil, penal y económica que se derive de sus decisiones de apuestas en casas externas.\n\n⚠️ IMPORTANTE: No apueste dinero que no esté dispuesto a perder. Juegue con responsabilidad y moderación.',
              ),
              _buildSection(
                '5. Suscripción Premium y Cancelaciones',
                'La membresía Premium otorga acceso a alertas ilimitadas mediante una suscripción mensual recurrente de \$150.00 MXN gestionada a través de Stripe de manera segura. Las suscripciones pueden cancelarse en cualquier momento desde los ajustes de su perfil.',
              ),
              _buildSection(
                '6. Modificaciones de los Términos',
                'Nos reservamos el derecho de modificar estos términos en cualquier momento. El uso continuado de la aplicación después de dichas modificaciones constituirá la aceptación de los nuevos términos.',
              ),
              const SizedBox(height: 32),
              ElevatedButton(
                onPressed: () => Navigator.pop(context),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primaryOrange,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: const Text(
                  'Entendido y Acepto',
                  style: TextStyle(fontWeight: FontWeight.bold),
                ),
              ),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSection(String title, String body) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(
              color: AppTheme.primaryOrange,
              fontSize: 16,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            body,
            style: const TextStyle(
              color: AppTheme.textLight,
              fontSize: 14,
              height: 1.5,
            ),
            textAlign: TextAlign.justify,
          ),
        ],
      ),
    );
  }
}
