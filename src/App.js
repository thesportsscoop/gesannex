import React, { useState, useEffect, createContext, useContext } from 'react';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithCustomToken,
  signInAnonymously,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  addDoc,
  collection,
  query,
  where,
  onSnapshot,
  updateDoc,
  deleteDoc,
  getDocs,
} from 'firebase/firestore';

// Global variables for Firebase config and auth token, provided by the Canvas environment.
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}');
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// Firebase Context to provide db, auth, and user info throughout the app
const FirebaseContext = createContext(null);

const FirebaseProvider = ({ children }) => {
  const [app, setApp] = useState(null);
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
  const [user, setUser] = useState(null);
  const [loadingFirebase, setLoadingFirebase] = useState(true);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    // Initialize Firebase app only once
    if (!app) {
      try {
        const firebaseApp = initializeApp(firebaseConfig);
        setApp(firebaseApp);
        setDb(getFirestore(firebaseApp));
        setAuth(getAuth(firebaseApp));
      } catch (error) {
        console.error("Firebase initialization failed:", error);
        setLoadingFirebase(false);
      }
    }
  }, [app, firebaseConfig]);

  useEffect(() => {
    if (auth) {
      // Listen for auth state changes
      const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
        if (currentUser) {
          setUser(currentUser);
          setUserId(currentUser.uid);
        } else {
          // If no user, try to sign in anonymously or with custom token
          try {
            if (initialAuthToken) {
              await signInWithCustomToken(auth, initialAuthToken);
            } else {
              await signInAnonymously(auth);
            }
            setUser(auth.currentUser);
            setUserId(auth.currentUser.uid);
          } catch (error) {
            console.error("Authentication failed:", error);
            // Fallback to a random ID if anonymous sign-in also fails
            setUserId(crypto.randomUUID());
          }
        }
        setLoadingFirebase(false);
      });

      return () => unsubscribe(); // Cleanup auth listener
    }
  }, [auth, initialAuthToken]);

  if (loadingFirebase) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-sky-700 text-lg font-semibold">Loading Firebase...</div>
      </div>
    );
  }

  return (
    <FirebaseContext.Provider value={{ db, auth, user, userId, appId }}>
      {children}
    </FirebaseContext.Provider>
  );
};

// Custom hook to use Firebase context
const useFirebase = () => useContext(FirebaseContext);


// Reusable Modal Component
const Modal = ({ show, onClose, title, children }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-auto overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-sky-700 text-white rounded-t-lg">
          <h3 className="text-lg font-bold">{title}</h3>
          <button onClick={onClose} className="text-white hover:text-gray-200 text-2xl leading-none">&times;</button>
        </div>
        <div className="p-6">
          {children}
        </div>
        <div className="p-4 border-t border-gray-200 text-right">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition duration-300 shadow-md"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};


// Home Component
const Home = () => {
  const { userId } = useFirebase(); // Get userId from context
  return (
    <section id="home" className="py-16 px-4 md:px-8 lg:px-16 text-center bg-white text-gray-800">
      <h2 className="text-4xl md:text-5xl font-extrabold text-sky-700 mb-6 leading-tight">
        Welcome to GES Annex
      </h2>
      <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
        Your ultimate learning companion, providing comprehensive educational materials, up-to-date news, and interactive quizzes for Basic, JHS, and SHS levels.
      </p>
      <div className="bg-sky-700 p-8 rounded-xl shadow-lg inline-block transform transition-all duration-300 hover:scale-105">
        <p className="text-white text-2xl font-semibold mb-4">Your User ID:</p>
        <p className="text-white text-lg font-mono break-all">{userId || 'Loading...'}</p>
        <p className="text-white text-sm mt-2">Share this ID for collaborative features or if you need support.</p>
      </div>
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        <div className="p-6 bg-blue-50 rounded-xl shadow-md transition-transform duration-300 hover:scale-105 hover:shadow-lg">
          <h3 className="text-2xl font-bold text-sky-700 mb-3">Comprehensive Materials</h3>
          <p className="text-gray-700">Access well-structured learning content tailored for each academic level.</p>
        </div>
        <div className="p-6 bg-blue-50 rounded-xl shadow-md transition-transform duration-300 hover:scale-105 hover:shadow-lg">
          <h3 className="text-2xl font-bold text-sky-700 mb-3">Interactive Quizzes</h3>
          <p className="text-gray-700">Test your knowledge and track your progress with our engaging quizzes.</p>
        </div>
        <div className="p-6 bg-blue-50 rounded-xl shadow-md transition-transform duration-300 hover:scale-105 hover:shadow-lg">
          <h3 className="text-2xl font-bold text-sky-700 mb-3">Educational News</h3>
          <p className="text-gray-700">Stay informed with the latest updates and trends in the world of education.</p>
        </div>
      </div>
    </section>
  );
};

// Learning Materials Component
const LearningMaterials = () => {
  const materials = {
    basic: [
      { title: "Phonics Fundamentals", description: "Learn the basics of phonics and reading." },
      { title: "Basic Numeracy Skills", description: "Understand fundamental math concepts." },
      { title: "Environmental Studies Intro", description: "Introduction to your environment." },
    ],
    jhs: [
      { title: "Integrated Science", description: "Comprehensive notes on integrated science for JHS." },
      { title: "Social Studies & Civics", description: "Exploring society, culture, and governance." },
      { title: "Mathematics for JHS", description: "Advanced topics in JHS mathematics." },
    ],
    shs: [
      { title: "Core Mathematics - Algebra", description: "In-depth study of algebraic concepts." },
      { title: "Elective Science - Physics", description: "Detailed notes on SHS Physics." },
      { title: "English Language - Essay Writing", description: "Mastering the art of effective essay writing." },
      { title: "Economics - Micro & Macro", description: "Understanding economic principles and theories." },
    ],
  };

  const [activeLevel, setActiveLevel] = useState('basic');

  return (
    <section id="materials" className="py-16 px-4 md:px-8 lg:px-16 bg-blue-50 text-gray-800">
      <h2 className="text-4xl font-extrabold text-sky-700 text-center mb-10">Learning Materials</h2>

      <div className="max-w-4xl mx-auto mb-8 flex flex-wrap justify-center gap-4">
        {['basic', 'jhs', 'shs'].map((level) => (
          <button
            key={level}
            onClick={() => setActiveLevel(level)}
            className={`px-6 py-3 rounded-full text-lg font-semibold transition-all duration-300
              ${activeLevel === level
                ? 'bg-sky-700 text-white shadow-lg'
                : 'bg-white text-sky-700 border border-sky-700 hover:bg-sky-100'
              }`}
          >
            {level.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {materials[activeLevel].map((item, index) => (
          <div
            key={index}
            className="bg-white p-6 rounded-xl shadow-md transition-all duration-300 hover:shadow-lg hover:translate-y-[-5px] border border-gray-100"
          >
            <h3 className="text-xl font-bold text-sky-700 mb-2">{item.title}</h3>
            <p className="text-gray-600 mb-4">{item.description}</p>
            <button className="inline-block px-5 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-300 shadow-md">
              View Material
            </button>
          </div>
        ))}
      </div>
      <p className="text-center text-gray-500 mt-10 text-sm">
        *More materials will be added regularly. Check back soon!
      </p>
    </section>
  );
};

// News Component (Placeholder for Netlify CMS)
const News = () => {
  const newsArticles = [
    {
      title: "New Curriculum Rollout for Basic Schools",
      date: "May 15, 2025",
      snippet: "The Ministry of Education has announced a new curriculum to be implemented across all basic schools starting next academic year...",
    },
    {
      title: "GES Exam Timetable Released",
      date: "April 28, 2025",
      snippet: "The Ghana Education Service (GES) has published the official timetable for the upcoming Basic Education Certificate Examination (BECE)...",
    },
    {
      title: "STEM Education Initiatives in SHS",
      date: "March 10, 2025",
      snippet: "New initiatives are being rolled out to boost Science, Technology, Engineering, and Mathematics (STEM) education in Senior High Schools...",
    },
  ];

  return (
    <section id="news" className="py-16 px-4 md:px-8 lg:px-16 bg-white text-gray-800">
      <h2 className="text-4xl font-extrabold text-sky-700 text-center mb-10">Education News & Updates</h2>
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
        {newsArticles.map((article, index) => (
          <div key={index} className="bg-blue-50 p-6 rounded-xl shadow-md transition-all duration-300 hover:shadow-lg hover:translate-y-[-5px]">
            <h3 className="text-2xl font-bold text-sky-700 mb-2">{article.title}</h3>
            <p className="text-sm text-gray-500 mb-3">{article.date}</p>
            <p className="text-gray-700 mb-4">{article.snippet}</p>
            <a href="#" className="inline-block px-5 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors duration-300 shadow-md">
              Read More
            </a>
          </div>
        ))}
      </div>
      <p className="text-center text-gray-500 mt-10 text-sm">
        *News articles are managed via Netlify CMS. This is a placeholder display.
      </p>
    </section>
  );
};

// Authentication Component
const Auth = ({ onAuthSuccess, showAuthModal, closeAuthModal }) => {
  const { auth, db, user, userId } = useFirebase();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true); // true for login, false for signup
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // Optional: Store user profile in Firestore
        await setDoc(doc(db, `artifacts/${appId}/users/${userCredential.user.uid}/profile`, 'info'), {
          email: userCredential.user.email,
          createdAt: new Date(),
          // Add any other profile info here
        });
      }
      onAuthSuccess(); // Callback to indicate successful auth
      closeAuthModal();
    } catch (err) {
      console.error("Auth error:", err.message);
      setError(err.message.replace('Firebase: ', '')); // Clean up error message
    } finally {
      setLoading(false);
    }
  };

  // If user is already authenticated and modal is shown, just close it or notify
  useEffect(() => {
    if (user && showAuthModal) {
      closeAuthModal();
    }
  }, [user, showAuthModal, closeAuthModal]);


  return (
    <Modal show={showAuthModal} onClose={closeAuthModal} title={isLogin ? 'Login' : 'Sign Up'}>
      {user ? (
        <div className="text-center">
          <p className="text-lg text-gray-700 font-semibold mb-4">You are already logged in as:</p>
          <p className="text-sky-700 font-bold mb-4">{user.email || user.uid}</p>
          <button
            onClick={async () => {
              try {
                await signOut(auth);
                setEmail('');
                setPassword('');
                setError('');
                closeAuthModal();
              } catch (err) {
                console.error("Logout error:", err);
                setError("Failed to log out.");
              }
            }}
            className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition duration-300 shadow-md"
          >
            Logout
          </button>
        </div>
      ) : (
        <form onSubmit={handleAuth} className="space-y-6">
          {error && <p className="text-red-600 text-center text-sm">{error}</p>}
          <div>
            <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">
              Email:
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition duration-200"
              placeholder="Enter your email"
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-gray-700 text-sm font-bold mb-2">
              Password:
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 mb-3 leading-tight focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition duration-200"
              placeholder="Enter your password"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-sky-700 hover:bg-sky-800 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transition duration-300 shadow-md"
            disabled={loading}
          >
            {loading ? 'Processing...' : (isLogin ? 'Login' : 'Sign Up')}
          </button>
          <p className="text-center text-gray-600 text-sm mt-4">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sky-700 hover:text-sky-800 font-bold ml-1 focus:outline-none"
            >
              {isLogin ? 'Sign Up' : 'Login'}
            </button>
          </p>
        </form>
      )}
    </Modal>
  );
};


// Quizzes Component
const Quizzes = () => {
  const { db, user, userId, appId } = useFirebase();
  const [quizzes, setQuizzes] = useState([]);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [quizTimer, setQuizTimer] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [timerInterval, setTimerInterval] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false); // State for showing admin panel
  const [adminPassword, setAdminPassword] = useState('');
  const [adminPasswordError, setAdminPasswordError] = useState('');
  const [showQuizCreationModal, setShowQuizCreationModal] = useState(false);

  // Fetch quizzes from Firestore
  useEffect(() => {
    if (!db) return;

    // Public quizzes
    const publicQuizzesRef = collection(db, `artifacts/${appId}/public/data/quizzes`);
    const q = query(publicQuizzesRef); // No orderBy to avoid index issues

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedQuizzes = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setQuizzes(fetchedQuizzes);
    }, (error) => {
      console.error("Error fetching quizzes:", error);
    });

    return () => unsubscribe();
  }, [db, appId]);

  const startQuiz = (quiz) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    setSelectedQuiz(quiz);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setScore(0);
    setShowResults(false);
    setTimeRemaining(quiz.timerSeconds);
    setQuizTimer(quiz.timerSeconds); // Store initial timer for reset

    // Start timer
    if (timerInterval) clearInterval(timerInterval);
    const interval = setInterval(() => {
      setTimeRemaining((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(interval);
          handleSubmitQuiz();
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
    setTimerInterval(interval);
  };

  const handleAnswerSelect = (option) => {
    setSelectedAnswer(option);
  };

  const handleNextQuestion = () => {
    if (selectedAnswer === null) {
      // Optional: show a message to select an answer
      return;
    }

    if (selectedAnswer === selectedQuiz.questions[currentQuestionIndex].correctAnswer) {
      setScore((prevScore) => prevScore + 1);
    }

    setSelectedAnswer(null); // Reset selected answer for next question
    if (currentQuestionIndex < selectedQuiz.questions.length - 1) {
      setCurrentQuestionIndex((prevIndex) => prevIndex + 1);
    } else {
      // End of quiz
      handleSubmitQuiz();
    }
  };

  const handleSubmitQuiz = async () => {
    if (timerInterval) clearInterval(timerInterval);
    setShowResults(true);

    // Save score to Firestore
    if (user && db && selectedQuiz) {
      try {
        const quizResultsRef = collection(db, `artifacts/${appId}/users/${userId}/quizResults`);
        await addDoc(quizResultsRef, {
          quizId: selectedQuiz.id,
          quizTitle: selectedQuiz.title,
          studentId: userId,
          studentEmail: user.email || 'anonymous',
          score: score,
          totalQuestions: selectedQuiz.questions.length,
          timeTaken: quizTimer - timeRemaining,
          completedAt: new Date(),
        });
        console.log("Quiz result saved!");
      } catch (error) {
        console.error("Error saving quiz result:", error);
      }
    }
  };

  const closeQuiz = () => {
    if (timerInterval) clearInterval(timerInterval);
    setSelectedQuiz(null);
    setShowResults(false);
  };

  const openAdminPanel = () => {
    if (!user) {
      setShowAuthModal(true); // Prompt login if not logged in
      return;
    }
    // For simplicity, we'll open a password prompt.
    // In a real app, this would be based on user roles from Firebase.
    setShowAdminPanel(true);
  };

  const closeAdminPanel = () => {
    setShowAdminPanel(false);
    setAdminPassword('');
    setAdminPasswordError('');
  };

  const handleAdminLogin = () => {
    // A very simple 'admin password' check. In a real app,
    // you'd have a robust admin user system with roles in Firestore.
    if (adminPassword === 'gesannexadmin') { // Replace with a more secure method
      setAdminPasswordError('');
      setShowAdminPanel(false);
      setShowQuizCreationModal(true); // Open quiz creation directly
    } else {
      setAdminPasswordError('Incorrect admin password.');
    }
  };

  const closeQuizCreationModal = () => {
    setShowQuizCreationModal(false);
  };


  // Quiz Creation Form (Teacher's View)
  const QuizCreationForm = ({ closeForm }) => {
    const { db, userId, appId, user } = useFirebase();
    const [quizTitle, setQuizTitle] = useState('');
    const [quizTimerSeconds, setQuizTimerSeconds] = useState(60);
    const [quizQuestions, setQuizQuestions] = useState([
      { questionText: '', options: ['', '', '', ''], correctAnswer: '' },
    ]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleQuestionChange = (index, field, value) => {
      const newQuestions = [...quizQuestions];
      newQuestions[index][field] = value;
      setQuizQuestions(newQuestions);
    };

    const handleOptionChange = (qIndex, oIndex, value) => {
      const newQuestions = [...quizQuestions];
      newQuestions[qIndex].options[oIndex] = value;
      setQuizQuestions(newQuestions);
    };

    const addQuestion = () => {
      setQuizQuestions([...quizQuestions, { questionText: '', options: ['', '', '', ''], correctAnswer: '' }]);
    };

    const removeQuestion = (index) => {
      const newQuestions = quizQuestions.filter((_, i) => i !== index);
      setQuizQuestions(newQuestions);
    };

    const saveQuiz = async (e) => {
      e.preventDefault();
      setMessage('');
      setLoading(true);

      if (!user) {
        setMessage("You must be logged in to create quizzes.");
        setLoading(false);
        return;
      }

      // Basic validation
      if (!quizTitle.trim() || quizTimerSeconds <= 0 || quizQuestions.some(q =>
        !q.questionText.trim() || q.options.some(opt => !opt.trim()) || !q.correctAnswer.trim()
      )) {
        setMessage("Please fill in all quiz fields and ensure timer is positive.");
        setLoading(false);
        return;
      }

      try {
        const quizzesRef = collection(db, `artifacts/${appId}/public/data/quizzes`);
        await addDoc(quizzesRef, {
          title: quizTitle,
          timerSeconds: quizTimerSeconds,
          questions: quizQuestions,
          creatorId: userId,
          createdAt: new Date(),
        });
        setMessage("Quiz saved successfully!");
        setQuizTitle('');
        setQuizTimerSeconds(60);
        setQuizQuestions([{ questionText: '', options: ['', '', '', ''], correctAnswer: '' }]);
        closeForm(); // Close the form after successful save
      } catch (error) {
        console.error("Error saving quiz:", error);
        setMessage("Failed to save quiz: " + error.message);
      } finally {
        setLoading(false);
      }
    };

    return (
      <Modal show={true} onClose={closeForm} title="Create New Quiz">
        <form onSubmit={saveQuiz} className="space-y-4">
          {message && <p className={`text-center ${message.includes('successfully') ? 'text-green-600' : 'text-red-600'} text-sm mb-4`}>{message}</p>}

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Quiz Title:</label>
            <input
              type="text"
              value={quizTitle}
              onChange={(e) => setQuizTitle(e.target.value)}
              className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-sky-500"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Timer (seconds per quiz):</label>
            <input
              type="number"
              value={quizTimerSeconds}
              onChange={(e) => setQuizTimerSeconds(Number(e.target.value))}
              className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-sky-500"
              min="10"
              required
            />
          </div>

          <h3 className="text-xl font-bold text-sky-700 mt-6 mb-4">Questions:</h3>
          {quizQuestions.map((q, qIndex) => (
            <div key={qIndex} className="bg-blue-100 p-4 rounded-lg shadow-sm border border-blue-200">
              <div className="flex justify-between items-center mb-3">
                <label className="block text-gray-700 text-md font-bold">Question {qIndex + 1}:</label>
                {quizQuestions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeQuestion(qIndex)}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    Remove
                  </button>
                )}
              </div>
              <input
                type="text"
                placeholder="Question text"
                value={q.questionText}
                onChange={(e) => handleQuestionChange(qIndex, 'questionText', e.target.value)}
                className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-sky-500 mb-3"
                required
              />
              <div className="space-y-2">
                {q.options.map((option, oIndex) => (
                  <input
                    key={oIndex}
                    type="text"
                    placeholder={`Option ${oIndex + 1}`}
                    value={option}
                    onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                    className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-sky-500"
                    required
                  />
                ))}
              </div>
              <label className="block text-gray-700 text-sm font-bold mt-3 mb-1">Correct Answer (exactly as typed in options):</label>
              <input
                type="text"
                placeholder="Correct Answer"
                value={q.correctAnswer}
                onChange={(e) => handleQuestionChange(qIndex, 'correctAnswer', e.target.value)}
                className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-sky-500 mt-2"
                required
              />
            </div>
          ))}

          <button
            type="button"
            onClick={addQuestion}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline transition duration-300 shadow-md"
          >
            Add Question
          </button>

          <button
            type="submit"
            className="w-full bg-sky-700 hover:bg-sky-800 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transition duration-300 shadow-md"
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Quiz'}
          </button>
        </form>
      </Modal>
    );
  };

  const QuizResultsTable = () => {
    const { db, userId, appId } = useFirebase();
    const [quizResults, setQuizResults] = useState([]);
    const [loadingResults, setLoadingResults] = useState(true);
    const [selectedQuizId, setSelectedQuizId] = useState('');
    const [availableQuizTitles, setAvailableQuizTitles] = useState([]);

    useEffect(() => {
        if (!db || !userId) return;

        // Fetch quiz titles created by the current user to populate dropdown
        const fetchAvailableQuizTitles = async () => {
          try {
            const publicQuizzesRef = collection(db, `artifacts/${appId}/public/data/quizzes`);
            const q = query(publicQuizzesRef, where('creatorId', '==', userId));
            const querySnapshot = await getDocs(q);
            const titles = querySnapshot.docs.map(doc => ({ id: doc.id, title: doc.data().title }));
            setAvailableQuizTitles(titles);
            if (titles.length > 0) {
              setSelectedQuizId(titles[0].id); // Select the first quiz by default
            }
          } catch (error) {
            console.error("Error fetching available quiz titles:", error);
          }
        };

        fetchAvailableQuizTitles();
    }, [db, userId, appId]);


    useEffect(() => {
      if (!db || !userId || !selectedQuizId) {
        setLoadingResults(false);
        return;
      }

      setLoadingResults(true);
      // Listen for quiz results for quizzes created by this user
      // Assuming a teacher can only see results for quizzes they created,
      // or results that are public if the app allowed.
      // For this implementation, let's fetch results for a specific quiz ID.
      // In a more complex app, results might be stored under a 'public/data/quizResults'
      // if shared, or 'users/{userId}/quizResults' if private to student.
      // Let's assume for 'teacher view', we query from the student's private results but filter by quizId.

      // To organize scores for the teacher, we need to query across all students' quizResults.
      // Firestore does not directly support 'query all user subcollections for field X'.
      // A common pattern is to have a centralized collection for 'all quiz submissions'
      // if teachers need to view all.
      // Let's create a public collection for `quizSubmissions` for teacher access.

      // Query from a public collection for all submissions
      const submissionsRef = collection(db, `artifacts/${appId}/public/data/quizSubmissions`);
      const q = query(submissionsRef, where('quizId', '==', selectedQuizId));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const results = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        // Sort results for consistent display (e.g., by score descending)
        results.sort((a, b) => b.score - a.score);
        setQuizResults(results);
        setLoadingResults(false);
      }, (error) => {
        console.error("Error fetching quiz results:", error);
        setLoadingResults(false);
      });

      return () => unsubscribe();
    }, [db, userId, appId, selectedQuizId]);

    const handleQuizSelectChange = (e) => {
      setSelectedQuizId(e.target.value);
    };

    return (
      <div className="p-4 bg-white rounded-xl shadow-lg border border-gray-100">
        <h3 className="text-2xl font-bold text-sky-700 mb-4">Quiz Results Overview</h3>

        {availableQuizTitles.length > 0 ? (
          <div className="mb-6">
            <label htmlFor="selectQuiz" className="block text-gray-700 text-sm font-bold mb-2">
              Select Quiz:
            </label>
            <select
              id="selectQuiz"
              value={selectedQuizId}
              onChange={handleQuizSelectChange}
              className="block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
            >
              {availableQuizTitles.map((quiz) => (
                <option key={quiz.id} value={quiz.id}>
                  {quiz.title}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <p className="text-gray-600 mb-4">No quizzes created by you found yet.</p>
        )}

        {loadingResults ? (
          <p className="text-sky-700">Loading results...</p>
        ) : quizResults.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200 rounded-lg">
              <thead className="bg-sky-700 text-white">
                <tr>
                  <th className="py-3 px-4 text-left font-semibold rounded-tl-lg">Student Email/ID</th>
                  <th className="py-3 px-4 text-left font-semibold">Score</th>
                  <th className="py-3 px-4 text-left font-semibold">Total Questions</th>
                  <th className="py-3 px-4 text-left font-semibold">Time Taken (s)</th>
                  <th className="py-3 px-4 text-left font-semibold rounded-tr-lg">Completed At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {quizResults.map((result) => (
                  <tr key={result.id} className="hover:bg-blue-50 transition-colors duration-200">
                    <td className="py-3 px-4">{result.studentEmail || result.studentId}</td>
                    <td className="py-3 px-4">{result.score}</td>
                    <td className="py-3 px-4">{result.totalQuestions}</td>
                    <td className="py-3 px-4">{result.timeTaken}</td>
                    <td className="py-3 px-4">
                      {result.completedAt?.toDate ? result.completedAt.toDate().toLocaleString() : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-600">No results found for the selected quiz yet.</p>
        )}
      </div>
    );
  };

  return (
    <section id="quizzes" className="py-16 px-4 md:px-8 lg:px-16 bg-blue-50 text-gray-800">
      <h2 className="text-4xl font-extrabold text-sky-700 text-center mb-10">Interactive Quizzes</h2>

      {selectedQuiz ? (
        // Quiz in Progress / Results
        <div className="max-w-xl mx-auto bg-white p-8 rounded-xl shadow-lg border border-gray-100">
          {!showResults ? (
            // Quiz Questions
            <>
              <h3 className="text-2xl font-bold text-sky-700 mb-4">{selectedQuiz.title}</h3>
              <div className="flex justify-between items-center mb-6 text-lg font-semibold">
                <p>Question {currentQuestionIndex + 1} of {selectedQuiz.questions.length}</p>
                <p>Time Left: <span className="text-red-600">{timeRemaining}s</span></p>
              </div>
              <p className="text-xl mb-6 text-gray-700">{selectedQuiz.questions[currentQuestionIndex].questionText}</p>
              <div className="space-y-3 mb-8">
                {selectedQuiz.questions[currentQuestionIndex].options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleAnswerSelect(option)}
                    className={`block w-full text-left px-5 py-3 rounded-lg border transition-all duration-200
                      ${selectedAnswer === option
                        ? 'bg-sky-500 text-white border-sky-600 shadow-md scale-105'
                        : 'bg-blue-50 text-sky-800 border-blue-200 hover:bg-blue-100'
                      }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
              <button
                onClick={handleNextQuestion}
                className="w-full bg-sky-700 hover:bg-sky-800 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transition duration-300 shadow-md"
                disabled={selectedAnswer === null}
              >
                {currentQuestionIndex < selectedQuiz.questions.length - 1 ? 'Next Question' : 'Submit Quiz'}
              </button>
            </>
          ) : (
            // Quiz Results
            <div className="text-center">
              <h3 className="text-3xl font-bold text-sky-700 mb-4">Quiz Completed!</h3>
              <p className="text-2xl font-semibold mb-6">Your Score: <span className="text-green-600">{score}</span> / {selectedQuiz.questions.length}</p>
              <p className="text-md text-gray-600 mb-2">Time Taken: {quizTimer - timeRemaining} seconds</p>
              <button
                onClick={closeQuiz}
                className="px-6 py-3 bg-sky-700 hover:bg-sky-800 text-white font-bold rounded-lg transition duration-300 shadow-md"
              >
                Back to Quizzes
              </button>
            </div>
          )}
        </div>
      ) : (
        // Quiz List and Admin Options
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-center mb-8 gap-4">
            <button
              onClick={openAdminPanel}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition duration-300 shadow-md"
            >
              Teacher Admin Panel
            </button>
          </div>

          <h3 className="text-2xl font-bold text-sky-700 mb-6 text-center">Available Quizzes</h3>
          {quizzes.length === 0 ? (
            <p className="text-center text-gray-600">No quizzes available yet. Check back soon!</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {quizzes.map((quiz) => (
                <div
                  key={quiz.id}
                  className="bg-white p-6 rounded-xl shadow-md transition-all duration-300 hover:shadow-lg hover:translate-y-[-5px] border border-gray-100"
                >
                  <h4 className="text-xl font-bold text-sky-700 mb-2">{quiz.title}</h4>
                  <p className="text-gray-600 text-sm mb-3">Questions: {quiz.questions.length}</p>
                  <p className="text-gray-600 text-sm mb-4">Timer: {quiz.timerSeconds} seconds</p>
                  <button
                    onClick={() => startQuiz(quiz)}
                    className="w-full px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-300 shadow-md"
                  >
                    Start Quiz
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <Auth
        onAuthSuccess={() => console.log("Auth success from Quizzes!")}
        showAuthModal={showAuthModal}
        closeAuthModal={() => setShowAuthModal(false)}
      />

      {/* Admin Password Modal */}
      <Modal show={showAdminPanel} onClose={closeAdminPanel} title="Admin Access">
        <div className="space-y-4">
          <p className="text-gray-700">Enter admin password to access quiz creation and results.</p>
          {adminPasswordError && <p className="text-red-600 text-sm">{adminPasswordError}</p>}
          <input
            type="password"
            value={adminPassword}
            onChange={(e) => setAdminPassword(e.target.value)}
            className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-sky-500"
            placeholder="Admin Password"
          />
          <button
            onClick={handleAdminLogin}
            className="w-full bg-sky-700 hover:bg-sky-800 text-white font-bold py-2 px-4 rounded-lg transition duration-300 shadow-md"
          >
            Submit
          </button>
        </div>
      </Modal>

      {/* Quiz Creation Modal */}
      {showQuizCreationModal && (
        <QuizCreationForm closeForm={closeQuizCreationModal} />
      )}

      {/* Quiz Results Table (Admin View) */}
      <div className="mt-12 max-w-6xl mx-auto">
        <QuizResultsTable />
      </div>
    </section>
  );
};

// About Us Component
const AboutUs = () => {
  return (
    <section id="about" className="py-16 px-4 md:px-8 lg:px-16 bg-white text-gray-800">
      <h2 className="text-4xl font-extrabold text-sky-700 text-center mb-10">About GES Annex</h2>
      <div className="max-w-4xl mx-auto text-lg leading-relaxed">
        <p className="mb-6">
          GES Annex is dedicated to empowering students in Ghana with quality educational resources. Our platform provides
          structured learning materials for Basic, Junior High School (JHS), and Senior High School (SHS) levels,
          designed to complement classroom learning and enhance understanding.
        </p>
        <p className="mb-6">
          Founded with the vision of making education accessible and engaging, we believe in fostering a love for learning.
          Our materials are carefully curated to align with the Ghanaian curriculum, ensuring relevance and effectiveness.
        </p>
        <p className="mb-6">
          Beyond just materials, we offer interactive quizzes that help students test their knowledge and track their progress.
          We also keep you updated with the latest news and developments in the education sector, making GES Annex your
          go-to hub for academic excellence.
        </p>
        <p className="font-semibold text-sky-700">
          Join us in building a brighter future through education!
        </p>
      </div>
    </section>
  );
};

// Contact Us Component
const ContactUs = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [statusMessage, setStatusMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatusMessage('Sending message...');
    // In a real application, you would send this data to a backend service (e.g., Netlify Forms, Firebase Functions, or an email service).
    // For this demonstration, we'll just simulate success.
    console.log('Contact form submitted:', formData);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      setStatusMessage('Message sent successfully! We will get back to you soon.');
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (error) {
      setStatusMessage('Failed to send message. Please try again.');
    }
  };

  return (
    <section id="contact" className="py-16 px-4 md:px-8 lg:px-16 bg-blue-50 text-gray-800">
      <h2 className="text-4xl font-extrabold text-sky-700 text-center mb-10">Contact Us</h2>
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-lg border border-gray-100">
        {statusMessage && (
          <div className={`p-3 mb-4 rounded-lg text-center ${statusMessage.includes('successfully') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {statusMessage}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-gray-700 text-sm font-bold mb-2">
              Name:
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition duration-200"
              required
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">
              Email:
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition duration-200"
              required
            />
          </div>
          <div>
            <label htmlFor="subject" className="block text-gray-700 text-sm font-bold mb-2">
              Subject:
            </label>
            <input
              type="text"
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              className="shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition duration-200"
              required
            />
          </div>
          <div>
            <label htmlFor="message" className="block text-gray-700 text-sm font-bold mb-2">
              Message:
            </label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              rows="5"
              className="shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition duration-200"
              required
            ></textarea>
          </div>
          <button
            type="submit"
            className="w-full bg-sky-700 hover:bg-sky-800 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:shadow-outline transition duration-300 shadow-md"
          >
            Send Message
          </button>
        </form>
        <div className="mt-8 text-center text-gray-600">
          <p>You can also reach us at:</p>
          <p className="font-semibold text-sky-700">Email: info@gesannex.com</p>
          <p className="font-semibold text-sky-700">Phone: +233 24 123 4567</p>
        </div>
      </div>
    </section>
  );
};

const App = () => {
  const [currentPage, setCurrentPage] = useState('home');

  const navigate = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <Home />;
      case 'materials':
        return <LearningMaterials />;
      case 'news':
        return <News />;
      case 'quizzes':
        return <Quizzes />;
      case 'about':
        return <AboutUs />;
      case 'contact':
        return <ContactUs />;
      default:
        return <Home />;
    }
  };

  return (
    <FirebaseProvider>
      <div className="min-h-screen flex flex-col font-sans bg-gray-100">
        {/* Tailwind CSS CDN */}
        <script src="https://cdn.tailwindcss.com"></script>
        {/* Inter font from Google Fonts */}
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
        <style>
          {`
          body {
            font-family: 'Inter', sans-serif;
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          `}
        </style>

        {/* Header */}
        <header className="bg-sky-700 text-white shadow-lg fixed top-0 left-0 w-full z-40">
          <nav className="container mx-auto px-4 py-4 flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center justify-between w-full md:w-auto mb-4 md:mb-0">
              <a href="#" onClick={() => navigate('home')} className="text-3xl font-extrabold tracking-wide hover:text-sky-100 transition-colors duration-300">
                GES Annex
              </a>
              {/* Hamburger Menu for Mobile */}
              <button
                className="md:hidden text-white focus:outline-none"
                onClick={() => {
                  const navMenu = document.getElementById('nav-menu');
                  if (navMenu.classList.contains('hidden')) {
                    navMenu.classList.remove('hidden');
                  } else {
                    navMenu.classList.add('hidden');
                  }
                }}
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path>
                </svg>
              </button>
            </div>
            <ul id="nav-menu" className="hidden md:flex flex-col md:flex-row md:space-x-8 space-y-4 md:space-y-0 w-full md:w-auto text-center md:text-left">
              <li>
                <a href="#" onClick={() => navigate('home')} className="block text-lg font-medium hover:text-sky-200 transition-colors duration-300 py-2 md:py-0 rounded-md">
                  Home
                </a>
              </li>
              <li>
                <a href="#" onClick={() => navigate('materials')} className="block text-lg font-medium hover:text-sky-200 transition-colors duration-300 py-2 md:py-0 rounded-md">
                  Learning Materials
                </a>
              </li>
              <li>
                <a href="#" onClick={() => navigate('news')} className="block text-lg font-medium hover:text-sky-200 transition-colors duration-300 py-2 md:py-0 rounded-md">
                  News
                </a>
              </li>
              <li>
                <a href="#" onClick={() => navigate('quizzes')} className="block text-lg font-medium hover:text-sky-200 transition-colors duration-300 py-2 md:py-0 rounded-md">
                  Quizzes
                </a>
              </li>
              <li>
                <a href="#" onClick={() => navigate('about')} className="block text-lg font-medium hover:text-sky-200 transition-colors duration-300 py-2 md:py-0 rounded-md">
                  About Us
                </a>
              </li>
              <li>
                <a href="#" onClick={() => navigate('contact')} className="block text-lg font-medium hover:text-sky-200 transition-colors duration-300 py-2 md:py-0 rounded-md">
                  Contact Us
                </a>
              </li>
            </ul>
          </nav>
        </header>

        {/* Main Content */}
        <main className="flex-grow mt-20"> {/* Adjust margin-top to account for fixed header */}
          {renderPage()}
        </main>

        {/* Footer */}
        <footer className="bg-sky-700 text-white py-8 px-4 md:px-8 lg:px-16 text-center shadow-inner">
          <p className="text-lg mb-3">© {new Date().getFullYear()} GES Annex. All rights reserved.</p>
          <p className="text-sm">Empowering Education in Ghana.</p>
        </footer>
      </div>
    </FirebaseProvider>
  );
};

export default App;
