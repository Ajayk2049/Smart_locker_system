import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';

import 'config.dart';
import 'view_models/auth_view_model.dart';
import 'view_models/home_view_model.dart';
import 'view_models/websocket_view_model.dart';
import 'views/auth/login_screen.dart';
import 'views/auth/register_screen.dart';
import 'views/home/home_screen.dart';
import 'views/home/history_screen.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  AppConfig.setEnvironment(isProd: false);
  runApp(const SecureBoxApp());
}

class SecureBoxApp extends StatelessWidget {
  const SecureBoxApp({super.key});

  @override
  Widget build(BuildContext context) {
    final colorScheme = ColorScheme.fromSeed(
      seedColor: const Color(0xFF0F0F11),
      brightness: Brightness.light,
    );

    final darkColorScheme = ColorScheme.fromSeed(
      seedColor: const Color(0xFF0F0F11),
      brightness: Brightness.dark,
    );

    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthViewModel()..init()),
        ChangeNotifierProvider(create: (_) => HomeViewModel()),
        ChangeNotifierProvider(create: (_) => WebSocketViewModel()),
      ],
      child: MaterialApp(
        title: 'Secure Box',
        debugShowCheckedModeBanner: false,
        theme: ThemeData(
          useMaterial3: true,
          colorScheme: colorScheme,
          textTheme: GoogleFonts.interTextTheme(),
          cardTheme: CardThemeData(
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(8),
            ),
          ),
        ),
        darkTheme: ThemeData(
          useMaterial3: true,
          colorScheme: darkColorScheme,
          textTheme: GoogleFonts.interTextTheme(
            ThemeData(brightness: Brightness.dark).textTheme,
          ),
          cardTheme: CardThemeData(
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(8),
            ),
          ),
        ),
        themeMode: ThemeMode.system,
        initialRoute: '/login',
        routes: {
          '/login': (context) => const LoginScreen(),
          '/register': (context) => const RegisterScreen(),
          '/home': (context) => const HomeScreen(),
          '/history': (context) => const HistoryScreen(),
        },
      ),
    );
  }
}
