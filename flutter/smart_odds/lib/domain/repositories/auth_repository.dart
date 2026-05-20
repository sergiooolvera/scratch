import 'dart:async';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:google_sign_in/google_sign_in.dart';

abstract class AuthRepository {
  Stream<User?> get authStateChanges;
  User? get currentUser;
  Future<UserCredential> signInWithEmail(String email, String password);
  Future<UserCredential> signUpWithEmail(String email, String password);
  Future<void> signInWithGoogle();
  Future<void> sendPasswordResetEmail(String email);
  Future<void> signOut();
}

class FirebaseAuthRepository implements AuthRepository {
  final FirebaseAuth _auth = FirebaseAuth.instance;

  @override
  Stream<User?> get authStateChanges => _auth.authStateChanges();

  @override
  User? get currentUser => _auth.currentUser;

  @override
  Future<UserCredential> signInWithEmail(String email, String password) {
    return _auth.signInWithEmailAndPassword(email: email, password: password);
  }

  @override
  Future<UserCredential> signUpWithEmail(String email, String password) {
    return _auth.createUserWithEmailAndPassword(email: email, password: password);
  }

  @override
  Future<void> signInWithGoogle() async {
    try {
      if (kIsWeb) {
        final GoogleAuthProvider googleProvider = GoogleAuthProvider();
        googleProvider.addScope('email');
        googleProvider.addScope('profile');

        // signInWithPopup funciona correctamente en Flutter Web
        await _auth.signInWithPopup(googleProvider);
      } else {
        // Flujo nativo para Android / iOS usando google_sign_in
        final GoogleSignIn googleSignIn = GoogleSignIn(
          scopes: ['email', 'profile'],
        );
        final GoogleSignInAccount? googleUser = await googleSignIn.signIn();
        if (googleUser == null) {
          // El usuario canceló la autenticación
          return;
        }
        final GoogleSignInAuthentication googleAuth = await googleUser.authentication;
        final AuthCredential credential = GoogleAuthProvider.credential(
          accessToken: googleAuth.accessToken,
          idToken: googleAuth.idToken,
        );
        await _auth.signInWithCredential(credential);
      }
    } catch (e) {
      throw Exception('Error en Google Sign-In: ${e.toString()}');
    }
  }

  @override
  Future<void> sendPasswordResetEmail(String email) {
    return _auth.sendPasswordResetEmail(email: email);
  }

  @override
  Future<void> signOut() {
    return _auth.signOut();
  }
}

// --- MOCK AUTHENTICATION FALLBACK FOR NO-FIREBASE/WEB ENVIRONMENT ---
class MockUser implements User {
  final String _email;
  final String _uid;

  MockUser(this._email, this._uid);

  @override
  String? get email => _email;

  @override
  String get uid => _uid;

  @override
  bool get emailVerified => true;

  @override
  String? get displayName => "Demo A la olla";

  @override
  List<UserInfo> get providerData => [];

  // Implement minimal required methods as no-ops for compilation
  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

class MockAuthRepository implements AuthRepository {
  final StreamController<User?> _controller = StreamController<User?>.broadcast();
  User? _currentUser;

  // In-memory registry — tracks accounts created during this session.
  // Pre-loaded with a few demo accounts.
  static final Map<String, String> _registeredUsers = {
    'test@example.com': 'password123',
    'sergio.olver@gmail.com': 'password123',
    'admin@alaolla.com': 'admin123',
  };

  MockAuthRepository() {
    _controller.add(null);
  }

  @override
  Stream<User?> get authStateChanges => _controller.stream;

  @override
  User? get currentUser => _currentUser;

  @override
  Future<UserCredential> signInWithEmail(String email, String password) async {
    await Future.delayed(const Duration(milliseconds: 600));
    final normalizedEmail = email.trim().toLowerCase();

    // Basic format validation
    if (!normalizedEmail.contains('@') || !normalizedEmail.contains('.')) {
      throw FirebaseAuthException(
        code: 'invalid-email',
        message: 'El correo ingresado no tiene un formato válido.',
      );
    }
    if (password.length < 6) {
      throw FirebaseAuthException(
        code: 'wrong-password',
        message: 'La contraseña debe tener al menos 6 caracteres.',
      );
    }

    // If the account was previously registered this session, validate password
    if (_registeredUsers.containsKey(normalizedEmail) &&
        _registeredUsers[normalizedEmail] != password) {
      throw FirebaseAuthException(
        code: 'wrong-password',
        message: 'La contraseña es incorrecta.',
      );
    }

    // Accept any valid-looking email+password (simulates real Firebase in web preview)
    _registeredUsers[normalizedEmail] = password;
    _currentUser = MockUser(email, "mock_uid_${email.hashCode}");
    _controller.add(_currentUser);
    return _createMockUserCredential(email);
  }

  @override
  Future<UserCredential> signUpWithEmail(String email, String password) async {
    await Future.delayed(const Duration(milliseconds: 600));
    final normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail.contains('@') || !normalizedEmail.contains('.')) {
      throw FirebaseAuthException(
        code: 'invalid-email',
        message: 'El correo ingresado no tiene un formato válido.',
      );
    }
    if (password.length < 6) {
      throw FirebaseAuthException(
        code: 'weak-password',
        message: 'La contraseña debe tener al menos 6 caracteres.',
      );
    }
    if (_registeredUsers.containsKey(normalizedEmail)) {
      throw FirebaseAuthException(
        code: 'email-already-in-use',
        message: 'Este correo ya está registrado.',
      );
    }

    _registeredUsers[normalizedEmail] = password;
    _currentUser = MockUser(email, "mock_uid_${email.hashCode}");
    _controller.add(_currentUser);
    return _createMockUserCredential(email);
  }

  @override
  Future<void> signInWithGoogle() async {
    await Future.delayed(const Duration(milliseconds: 400));
    _currentUser = MockUser("google.demo@alaolla.com", "mock_google_uid");
    _controller.add(_currentUser);
  }

  @override
  Future<void> sendPasswordResetEmail(String email) async {
    await Future.delayed(const Duration(milliseconds: 400));
    // In mock mode always succeeds (simulates sending the email)
  }

  @override
  Future<void> signOut() async {
    _currentUser = null;
    _controller.add(null);
  }

  UserCredential _createMockUserCredential(String email) {
    return _MockUserCredential(MockUser(email, "mock_uid_${email.hashCode}"));
  }
}

class _MockUserCredential implements UserCredential {
  @override
  final User user;

  _MockUserCredential(this.user);

  @override
  AuthCredential? get credential => null;

  @override
  AdditionalUserInfo? get additionalUserInfo => null;

  @override
  UserMetadata? get metadata => null;
}
