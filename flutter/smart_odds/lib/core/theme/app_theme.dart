import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  // Brand color palette
  static const Color primaryOrange = Color(0xFFFF7E33); // Soft vibrant orange
  static const Color accentOrange = Color(0xFFFF9E59);  // Accent soft orange
  static const Color backgroundDark = Color(0xFF0F0E13); // Deep dark purple-black
  static const Color surfaceDark = Color(0xFF1B1921);    // Soft dark grey-purple surface
  static const Color surfaceCard = Color(0xFF23212C);    // Card surface
  static const Color textLight = Color(0xFFF2F1F4);      // Off-white primary text
  static const Color textMuted = Color(0xFF908D9C);      // Muted grey text
  static const Color valueGreen = Color(0xFF26D07C);     // Neon green for positive value edges

  static ThemeData get darkTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      primaryColor: primaryOrange,
      scaffoldBackgroundColor: backgroundDark,
      colorScheme: const ColorScheme.dark(
        primary: primaryOrange,
        secondary: accentOrange,
        background: backgroundDark,
        surface: surfaceDark,
        onPrimary: textLight,
        onBackground: textLight,
        onSurface: textLight,
      ),
      textTheme: GoogleFonts.outfitTextTheme(ThemeData.dark().textTheme).copyWith(
        titleLarge: GoogleFonts.outfit(
          fontSize: 22,
          fontWeight: FontWeight.bold,
          color: textLight,
        ),
        titleMedium: GoogleFonts.outfit(
          fontSize: 18,
          fontWeight: FontWeight.w600,
          color: textLight,
        ),
        bodyLarge: GoogleFonts.outfit(
          fontSize: 16,
          color: textLight,
        ),
        bodyMedium: GoogleFonts.outfit(
          fontSize: 14,
          color: textMuted,
        ),
      ),
      /* cardTheme: CardTheme(
        color: surfaceCard,
        elevation: 4,
        shadowColor: Colors.black.withOpacity(0.5),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
        ),
      ), */
      appBarTheme: const AppBarTheme(
        backgroundColor: backgroundDark,
        elevation: 0,
        centerTitle: false,
        iconTheme: IconThemeData(color: textLight),
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: surfaceDark,
        selectedItemColor: primaryOrange,
        unselectedItemColor: textMuted,
        showSelectedLabels: true,
        showUnselectedLabels: true,
        type: BottomNavigationBarType.fixed,
      ),
    );
  }
}
