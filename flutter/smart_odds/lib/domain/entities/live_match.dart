import 'package:cloud_firestore/cloud_firestore.dart';

class LiveMatch {
  final String id;
  final String homeTeam;
  final String awayTeam;
  final int minute;
  final int scoreHome;
  final int scoreAway;
  final Map<String, dynamic> liveStats;
  final Map<String, dynamic> oddsDetail;
  final bool isSimulated;

  LiveMatch({
    required this.id,
    required this.homeTeam,
    required this.awayTeam,
    required this.minute,
    required this.scoreHome,
    required this.scoreAway,
    required this.liveStats,
    required this.oddsDetail,
    required this.isSimulated,
  });

  factory LiveMatch.fromJson(Map<String, dynamic> json, String documentId) {
    return LiveMatch(
      id: documentId,
      homeTeam: json['home_team'] ?? '',
      awayTeam: json['away_team'] ?? '',
      minute: (json['minute'] as num?)?.toInt() ?? 0,
      scoreHome: (json['score_home'] as num?)?.toInt() ?? 0,
      scoreAway: (json['score_away'] as num?)?.toInt() ?? 0,
      liveStats: json['live_stats'] != null ? Map<String, dynamic>.from(json['live_stats']) : {},
      oddsDetail: json['odds_detail'] != null ? Map<String, dynamic>.from(json['odds_detail']) : {},
      isSimulated: json['is_simulated'] ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'home_team': homeTeam,
      'away_team': awayTeam,
      'minute': minute,
      'score_home': scoreHome,
      'score_away': scoreAway,
      'live_stats': liveStats,
      'odds_detail': oddsDetail,
      'is_simulated': isSimulated,
    };
  }
}
