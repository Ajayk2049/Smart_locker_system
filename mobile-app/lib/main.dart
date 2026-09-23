import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:liquid_glass_easy/liquid_glass_easy.dart';

import 'config.dart';
import 'view_models/auth_view_model.dart';
import 'view_models/home_view_model.dart';
import 'view_models/theme_view_model.dart';
import 'view_models/websocket_view_model.dart';
import 'views/auth/login_screen.dart';
import 'views/auth/register_screen.dart';
import 'views/home/home_screen.dart';
import 'views/home/history_screen.dart';
import 'views/widgets/glass_theme.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await AppConfig.init(isProd: false);
  try {
    await LiquidGlassShaders.ensureLoaded();
  } catch (_) {}

  runApp(const SecureBoxApp());
}

class SecureBoxApp extends StatelessWidget {
  const SecureBoxApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => ThemeViewModel()),
        ChangeNotifierProvider(create: (_) => AuthViewModel()..init()),
        ChangeNotifierProvider(create: (_) => HomeViewModel()),
        ChangeNotifierProvider(create: (_) => WebSocketViewModel()),
      ],
      child: Consumer<ThemeViewModel>(
        builder: (context, themeVM, _) {
          return MaterialApp(
            title: 'Secure Box',
            debugShowCheckedModeBanner: false,
            themeMode: themeVM.themeMode,
            theme: ThemeData(
              useMaterial3: true,
              brightness: Brightness.light,
              scaffoldBackgroundColor: ParcelGlassColors.lightCanvasTop,
              textTheme: GoogleFonts.plusJakartaSansTextTheme(
                ThemeData(brightness: Brightness.light).textTheme,
              ),
              colorScheme: ColorScheme.fromSeed(
                seedColor: ParcelGlassColors.amberSignal,
                brightness: Brightness.light,
                primary: ParcelGlassColors.parcelBrown,
                secondary: ParcelGlassColors.mintSignal,
              ),
            ),
            darkTheme: ThemeData(
              useMaterial3: true,
              brightness: Brightness.dark,
              scaffoldBackgroundColor: ParcelGlassColors.darkCanvasBottom,
              textTheme: GoogleFonts.plusJakartaSansTextTheme(
                ThemeData(brightness: Brightness.dark).textTheme,
              ),
              colorScheme: ColorScheme.fromSeed(
                seedColor: ParcelGlassColors.mintSignal,
                brightness: Brightness.dark,
                primary: ParcelGlassColors.mintSignal,
                secondary: ParcelGlassColors.amberSignal,
                surface: const Color(0xFF1E150F),
              ),
            ),
            initialRoute: '/login',
            routes: {
              '/login': (context) => const LoginScreen(),
              '/register': (context) => const RegisterScreen(),
              '/home': (context) => const HomeScreen(),
              '/history': (context) => const HistoryScreen(),
            },
          );
        },
      ),
    );
  }
}
