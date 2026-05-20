import 'package:cloud_firestore/cloud_firestore.dart';

class Alert {
  final String id;
  final String title;
  final String description;
  final String? descriptionSpicy;
  final String market;
  final double line;
  final double odds;
  final double probReal;
  final double probImplied;
  final double edge;
  final String homeTeam;
  final String awayTeam;
  final String score;
  final int minute;
  final DateTime createdAt;
  final String status;
  final bool isSafe;

  Alert({
    required this.id,
    required this.title,
    required this.description,
    this.descriptionSpicy,
    required this.market,
    required this.line,
    required this.odds,
    required this.probReal,
    required this.probImplied,
    required this.edge,
    required this.homeTeam,
    required this.awayTeam,
    required this.score,
    required this.minute,
    required this.createdAt,
    this.status = 'pending',
    this.isSafe = false,
  });

  factory Alert.fromJson(Map<String, dynamic> json, String documentId) {
    DateTime parseDateTime(dynamic value) {
      if (value is Timestamp) {
        return value.toDate();
      } else if (value is String) {
        return DateTime.tryParse(value) ?? DateTime.now();
      }
      return DateTime.now();
    }

    return Alert(
      id: documentId,
      title: json['title'] ?? 'Alerta de Valor',
      description: json['description'] ?? '',
      descriptionSpicy: json['description_spicy'],
      market: json['market'] ?? 'Otros',
      line: (json['line'] as num?)?.toDouble() ?? 0.0,
      odds: (json['odds'] as num?)?.toDouble() ?? 1.0,
      probReal: (json['prob_real'] as num?)?.toDouble() ?? 0.0,
      probImplied: (json['prob_implied'] as num?)?.toDouble() ?? 0.0,
      edge: (json['edge'] as num?)?.toDouble() ?? 0.0,
      homeTeam: json['home_team'] ?? '',
      awayTeam: json['away_team'] ?? '',
      score: json['score'] ?? '0-0',
      minute: (json['minute'] as num?)?.toInt() ?? 0,
      createdAt: parseDateTime(json['created_at']),
      status: json['status'] ?? 'pending',
      isSafe: json['is_safe'] ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'description': description,
      'description_spicy': descriptionSpicy,
      'market': market,
      'line': line,
      'odds': odds,
      'prob_real': probReal,
      'prob_implied': probImplied,
      'edge': edge,
      'home_team': homeTeam,
      'away_team': awayTeam,
      'score': score,
      'minute': minute,
      'created_at': Timestamp.fromDate(createdAt),
      'status': status,
      'is_safe': isSafe,
    };
  }
}
