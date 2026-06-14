import { useEffect, useMemo, useState } from 'react';
import AppShell from './components/AppShell';
import BrandLogo from './components/BrandLogo';
import Onboarding from './screens/Onboarding';
import AuthScreen from './screens/Auth';
import HomeScreen from './screens/Home';
import GlucoseScreen from './screens/Glucose';
import InsulinScreen from './screens/Insulin';
import MealsScreen from './screens/Meals';
import ExerciseScreen from './screens/Exercise';
import InsightsScreen from './screens/Insights';
import ProfileScreen from './screens/Profile';
import ImportHistoryScreen from './screens/ImportHistory';
import LearnScreen from './screens/Learn';
import { BORDER, MUTED, TEXT } from './constants/theme';
import { getStats } from './utils/stats';
import { zukariCloudStore as zukariStorage } from './services/zukariCloudStore';
import { reminderService } from './services/reminderService';

function sortByLoggedAtAsc(items) {
  return [...items].sort((a, b) => {
    const left = new Date(a.loggedAt || a.createdAt || 0).getTime();
    const right = new Date(b.loggedAt || b.createdAt || 0).getTime();
    return left - right;
  });
}

function LoadingScreen() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        background: '#f7efe7',
        color: TEXT,
        fontFamily:
          "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        padding: 20,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 380,
          background: '#fffaf5',
          border: `1px solid ${BORDER}`,
          borderRadius: 26,
          boxShadow: '0 18px 50px rgba(43,22,9,.10)',
          padding: 24,
          textAlign: 'center',
        }}
      >
        <BrandLogo
          size={86}
          style={{
            margin: '0 auto 14px',
            borderRadius: 24,
          }}
        />
        <div style={{ fontWeight: 950, fontSize: 18 }}>Loading Zukari</div>
        <div style={{ color: MUTED, fontWeight: 700, fontSize: 13, marginTop: 6 }}>
          Syncing your cloud sugar diary.
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [screen, setScreen] = useState('home');
  const [isLoading, setIsLoading] = useState(true);
  const [glucose, setGlucose] = useState([]);
  const [insulin, setInsulin] = useState([]);
  const [meals, setMeals] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [authUser, setAuthUser] = useState(null);
  const [preferences, setPreferences] = useState({
    welcomeCompleted: false,
    name: 'Bo$$',
    phone: '',
    diabetesType: 'type_1',
    glucoseUnit: 'mmol/L',
    targetMin: 3.9,
    targetMax: 10,
    insulinTypes: ['Novorapid', 'Lantus'],
    reminderGlucose: true,
    reminderMedication: true,
    reminderInsulin: true,
    reminderBedtime: true,
    reminderGlucoseTime: '07:30',
    reminderMedicationTime: '21:00',
    reminderInsulinTime: '12:45',
    reminderBedtimeTime: '22:30',
    gender: 'not_set',
    darkMode: false,
  });

  const [gVal, setGVal] = useState('');
  const [gNote, setGNote] = useState('');
  const [iType, setIType] = useState('Novorapid');
  const [iDose, setIDose] = useState('');
  const [mName, setMName] = useState('');
  const [mCarbs, setMCarbs] = useState('');
  const [eType, setEType] = useState('Walking');
  const [eDur, setEDur] = useState('');
  const [welcomeStep, setWelcomeStep] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadLocalData() {
      try {
        const migratedPreferences = await zukariStorage.migrateLegacyWelcomeFlag();
        const data = await zukariStorage.getAllData();
        const authSession = await zukariStorage.getAuthSession();

        if (!active) return;

        const loadedPreferences = { ...data.preferences, ...migratedPreferences };

        setGlucose(data.glucoseLogs);
        setInsulin(data.insulinLogs);
        setMeals(data.mealLogs);
        setExercises(data.activityLogs);
        setPreferences(loadedPreferences);
        setAuthUser(authSession?.user || null);

        reminderService.syncReminders(loadedPreferences).catch((error) => {
          console.warn('Failed to sync Zukari reminders on startup', error);
        });

        if (Array.isArray(loadedPreferences.insulinTypes) && loadedPreferences.insulinTypes.length > 0) {
          setIType((currentType) =>
            loadedPreferences.insulinTypes.includes(currentType) ? currentType : loadedPreferences.insulinTypes[0]
          );
        }
      } catch (error) {
        console.error('Failed to load Zukari data', error);
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    loadLocalData();

    return () => {
      active = false;
    };
  }, []);

  const finishWelcome = async () => {
    const updated = await zukariStorage.updatePreferences({ welcomeCompleted: true });
    setPreferences(updated);
  };

  const handleLogin = async (credentials) => {
    const result = await zukariStorage.loginUser(credentials);
    const latestPreferences = await zukariStorage.getPreferences();

    setAuthUser(result.user);
    setPreferences(latestPreferences);

    if (Array.isArray(latestPreferences.insulinTypes) && latestPreferences.insulinTypes.length > 0) {
      setIType((currentType) =>
        latestPreferences.insulinTypes.includes(currentType) ? currentType : latestPreferences.insulinTypes[0]
      );
    }

    setScreen('home');
    return result;
  };

  const handleRegister = async (payload) => {
    const result = await zukariStorage.registerUser(payload);
    const latestPreferences = await zukariStorage.getPreferences();

    setAuthUser(result.user);
    setPreferences(latestPreferences);
    setScreen('profile');

    return result;
  };

  const handleLogout = async () => {
    await zukariStorage.logoutUser();
    setAuthUser(null);
    setScreen('home');
  };

  const normalizeTimestamp = (loggedAt) => {
    return loggedAt && !Number.isNaN(new Date(loggedAt).getTime())
      ? new Date(loggedAt).toISOString()
      : new Date().toISOString();
  };

  const handleAddGlucose = async ({ value, note, loggedAt }) => {
    const timestamp = normalizeTimestamp(loggedAt);

    const saved = await zukariStorage.addGlucoseLog({
      value,
      unit: preferences.glucoseUnit,
      context: 'random',
      notes: note || 'Manual',
      note: note || 'Manual',
      loggedAt: timestamp,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    setGlucose((current) => sortByLoggedAtAsc([...current, saved]));
  };

  const handleUpdateGlucose = async (id, partial) => {
    const saved = await zukariStorage.updateGlucoseLog(id, {
      ...partial,
      loggedAt: normalizeTimestamp(partial.loggedAt),
      unit: partial.unit || preferences.glucoseUnit,
    });

    setGlucose((current) => sortByLoggedAtAsc(current.map((item) => (item.id === id ? saved : item))));
    return saved;
  };

  const handleDeleteGlucose = async (id) => {
    await zukariStorage.deleteGlucoseLog(id);
    setGlucose((current) => current.filter((item) => item.id !== id));
  };

  const handleAddInsulin = async ({ insulinType, units, notes, loggedAt }) => {
    const timestamp = normalizeTimestamp(loggedAt);
    const saved = await zukariStorage.addInsulinLog({
      insulinType,
      units,
      notes: notes || '',
      loggedAt: timestamp,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    setInsulin((current) => sortByLoggedAtAsc([...current, saved]));
  };

  const handleUpdateInsulin = async (id, partial) => {
    const saved = await zukariStorage.updateInsulinLog(id, {
      ...partial,
      loggedAt: normalizeTimestamp(partial.loggedAt),
    });

    setInsulin((current) => sortByLoggedAtAsc(current.map((item) => (item.id === id ? saved : item))));
    return saved;
  };

  const handleDeleteInsulin = async (id) => {
    await zukariStorage.deleteInsulinLog(id);
    setInsulin((current) => current.filter((item) => item.id !== id));
  };

  const handleAddMeal = async ({ mealName, carbsEstimate, notes, loggedAt }) => {
    const timestamp = normalizeTimestamp(loggedAt);
    const saved = await zukariStorage.addMealLog({
      mealName,
      carbsEstimate,
      notes: notes || '',
      loggedAt: timestamp,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    setMeals((current) => sortByLoggedAtAsc([...current, saved]));
  };

  const handleUpdateMeal = async (id, partial) => {
    const saved = await zukariStorage.updateMealLog(id, {
      ...partial,
      loggedAt: normalizeTimestamp(partial.loggedAt),
    });

    setMeals((current) => sortByLoggedAtAsc(current.map((item) => (item.id === id ? saved : item))));
    return saved;
  };

  const handleDeleteMeal = async (id) => {
    await zukariStorage.deleteMealLog(id);
    setMeals((current) => current.filter((item) => item.id !== id));
  };

  const handleAddActivity = async ({ activityName, durationMinutes, notes, loggedAt }) => {
    const timestamp = normalizeTimestamp(loggedAt);
    const saved = await zukariStorage.addActivityLog({
      activityName,
      durationMinutes,
      notes: notes || '',
      loggedAt: timestamp,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    setExercises((current) => sortByLoggedAtAsc([...current, saved]));
  };

  const handleUpdateActivity = async (id, partial) => {
    const saved = await zukariStorage.updateActivityLog(id, {
      ...partial,
      loggedAt: normalizeTimestamp(partial.loggedAt),
    });

    setExercises((current) => sortByLoggedAtAsc(current.map((item) => (item.id === id ? saved : item))));
    return saved;
  };

  const handleDeleteActivity = async (id) => {
    await zukariStorage.deleteActivityLog(id);
    setExercises((current) => current.filter((item) => item.id !== id));
  };


  const handleImportHistoricalLogs = async ({ glucoseLogs = [], insulinLogs = [] }) => {
    const importedGlucose = await zukariStorage.bulkImportGlucoseLogs(glucoseLogs);
    const importedInsulin = await zukariStorage.bulkImportInsulinLogs(insulinLogs);

    setGlucose((current) => sortByLoggedAtAsc([...current, ...importedGlucose]));
    setInsulin((current) => sortByLoggedAtAsc([...current, ...importedInsulin]));

    return {
      glucoseCount: importedGlucose.length,
      insulinCount: importedInsulin.length,
    };
  };

  const handleUpdatePreferences = async (partial) => {
    const updated = await zukariStorage.updatePreferences(partial);

    if (partial.name !== undefined || partial.phone !== undefined || partial.diabetesType !== undefined) {
      const updatedUser = await zukariStorage.updateCurrentUser({
        name: updated.name,
        phone: updated.phone,
        diabetesType: updated.diabetesType,
      });

      if (updatedUser) {
        setAuthUser(updatedUser);
      }
    }

    setPreferences(updated);

    const reminderResult = await reminderService.syncReminders(updated).catch((error) => ({
      ok: false,
      scheduled: 0,
      message: error?.message || 'Could not sync reminders.',
    }));

    if (Array.isArray(updated.insulinTypes) && updated.insulinTypes.length > 0) {
      setIType((currentType) =>
        updated.insulinTypes.includes(currentType) ? currentType : updated.insulinTypes[0]
      );
    }

    return { preferences: updated, reminders: reminderResult };
  };

  const stats = useMemo(
    () => getStats({ glucose, insulin, meals, exercises, preferences }),
    [glucose, insulin, meals, exercises, preferences]
  );

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!preferences.welcomeCompleted) {
    return (
      <Onboarding
        welcomeStep={welcomeStep}
        setWelcomeStep={setWelcomeStep}
        finishWelcome={finishWelcome}
        tir={stats.tir}
      />
    );
  }

  if (!authUser) {
    return <AuthScreen onLogin={handleLogin} onRegister={handleRegister} />;
  }

  const common = { stats, preferences };
  const screens = {
    home: <HomeScreen {...common} glucose={glucose} setScreen={setScreen} />,
    blood_sugar: (
      <GlucoseScreen
        glucose={glucose}
        preferences={preferences}
        form={{ gVal, setGVal, gNote, setGNote }}
        onAddGlucose={handleAddGlucose}
        onUpdateGlucose={handleUpdateGlucose}
        onDeleteGlucose={handleDeleteGlucose}
      />
    ),
    insulin: (
      <InsulinScreen
        {...common}
        insulin={insulin}
        form={{ iType, setIType, iDose, setIDose }}
        onAddInsulin={handleAddInsulin}
        onUpdateInsulin={handleUpdateInsulin}
        onDeleteInsulin={handleDeleteInsulin}
      />
    ),
    meals: (
      <MealsScreen
        meals={meals}
        form={{ mName, setMName, mCarbs, setMCarbs }}
        onAddMeal={handleAddMeal}
        onUpdateMeal={handleUpdateMeal}
        onDeleteMeal={handleDeleteMeal}
      />
    ),
    exercise: (
      <ExerciseScreen
        exercises={exercises}
        form={{ eType, setEType, eDur, setEDur }}
        onAddActivity={handleAddActivity}
        onUpdateActivity={handleUpdateActivity}
        onDeleteActivity={handleDeleteActivity}
      />
    ),
    insights: <InsightsScreen {...common} glucose={glucose} insulin={insulin} meals={meals} exercises={exercises} />,
    learn: <LearnScreen {...common} glucose={glucose} insulin={insulin} meals={meals} exercises={exercises} />,
    import_history: (
      <ImportHistoryScreen
        preferences={preferences}
        onImportHistoricalLogs={handleImportHistoricalLogs}
        setScreen={setScreen}
      />
    ),
    profile: (
      <ProfileScreen
        preferences={preferences}
        authUser={authUser}
        onUpdatePreferences={handleUpdatePreferences}
        onLogout={handleLogout}
        setScreen={setScreen}
      />
    ),
  };

  return (
    <AppShell
      screen={screen}
      setScreen={setScreen}
      glucoseUnit={preferences.glucoseUnit}
      name={preferences.name}
      preferences={preferences}
      onLogout={handleLogout}
    >
      {screens[screen] || screens.home}
    </AppShell>
  );
}
