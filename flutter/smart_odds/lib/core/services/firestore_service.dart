import 'package:cloud_firestore/cloud_firestore.dart';
import '../../../domain/entities/alert.dart';
import '../../../domain/entities/live_match.dart';

class FirestoreService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  // Stream active alerts sorted by creation time descending
  Stream<List<Alert>> watchAlerts() {
    return _firestore
        .collection('alerts')
        .snapshots()
        .map((snapshot) {
      final list = snapshot.docs.map((doc) {
        return Alert.fromJson(doc.data(), doc.id);
      }).toList();
      // Sort descending by creation date programmatically in Dart
      list.sort((a, b) => b.createdAt.compareTo(a.createdAt));
      return list;
    });
  }

  // Stream active live soccer matches
  Stream<List<LiveMatch>> watchLiveMatches() {
    return _firestore
        .collection('live_matches')
        .snapshots()
        .map((snapshot) {
      return snapshot.docs.map((doc) {
        return LiveMatch.fromJson(doc.data(), doc.id);
      }).toList();
    });
  }

  // Delete live match manually from Firestore
  Future<void> deleteLiveMatch(String matchId) {
    return _firestore.collection('live_matches').doc(matchId).delete();
  }
}
