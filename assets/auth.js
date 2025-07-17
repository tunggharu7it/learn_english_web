import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getDatabase, ref, set, update } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import { getFirestore, collection, addDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  doc,
  deleteDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";


// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAkhHvoWKDxAUsDXoJx7l2UzyQ2YOPw290",
  authDomain: "englishweb-78aa8.firebaseapp.com",
  projectId: "englishweb-78aa8",
  storageBucket: "englishweb-78aa8.firebasestorage.app",
  messagingSenderId: "925453751767",
  appId: "1:925453751767:web:14a0ce38c8330882e36792"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);
const db = getFirestore(app); // Dùng biến app đã có sẵn

// Display message function
function displayMessage(message, elementId, isError = false) {
    const messageDiv = document.getElementById(elementId);
    if (messageDiv) {
        messageDiv.style.display = 'block';
        messageDiv.textContent = message;
        messageDiv.style.backgroundColor = isError ? 'hsl(327, 90%, 28%)' : 'green';
        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 5000);
    }
}

// Sign-up functionality
document.addEventListener('DOMContentLoaded', function() {
    const signUpButton = document.getElementById('signUp');
    if (signUpButton) {
        signUpButton.addEventListener('click', (event) => {
            event.preventDefault();
            const email = document.getElementById('rEmail').value;
            const password = document.getElementById('rPassword').value;
            const cpassword = document.getElementById('cPassword').value;

            if (password !== cpassword) {
                displayMessage("Passwords do not match!", 'signUpMessage', true);
                return;
            }

            createUserWithEmailAndPassword(auth, email, password)
                .then((userCredential) => {
                    const user = userCredential.user;
                    localStorage.setItem('loggedInUserId', user.uid);
                    set(ref(database, 'users/' + user.uid), {
                        email: email,
                        password: password, // Note: Storing passwords in plain text is not recommended for production
                        cpassword: cpassword,
                        created_at: new Date().toISOString()
                    })
                    .then(() => {
                        displayMessage("Sign-up successful! Redirecting...", 'signUpMessage');
                        setTimeout(() => {
                            window.location.href = '/index';
                        }, 2000);
                    })
                    .catch((error) => {
                        displayMessage("Error saving user data: " + error.message, 'signUpMessage', true);
                    });
                })
                .catch((error) => {
                    displayMessage("Sign-up failed: " + error.message, 'signUpMessage', true);
                });
        });
    }

    // Sign-in functionality
    const signInButton = document.getElementById('signIn');
    if (signInButton) {
        signInButton.addEventListener('click', (event) => {
            event.preventDefault();
            const email = document.getElementById('email_field').value;
            const password = document.getElementById('password_field').value;

            signInWithEmailAndPassword(auth, email, password)
                .then((userCredential) => {
                    const user = userCredential.user;
                    localStorage.setItem('loggedInUserId', user.uid);
                    const dt = new Date();
                    update(ref(database, 'users/' + user.uid), {
                        last_login: dt.toISOString()
                    })
                    .then(() => {
                        displayMessage("Sign-in successful! Redirecting...", 'signInMessage');
                        setTimeout(() => {
                            window.location.href = '/index';
                        }, 2000);
                    })
                    .catch((error) => {
                        displayMessage("Error updating login time: " + error.message, 'signInMessage', true);
                    });
                })
                .catch((error) => {
                    displayMessage("Sign-in failed: " + error.message, 'signInMessage', true);
                });
        });
    }

    // Logout functionality
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            signOut(auth)
                .then(() => {
                    localStorage.removeItem('loggedInUserId');
                    window.location.href = '/login';
                })
                .catch((error) => {
                    alert("Logout failed: " + error.message);
                });
        });
    }
});

// Monitor auth state and update username
onAuthStateChanged(auth, (user) => {
    const currentPath = window.location.pathname;
    const userEmailElement = document.getElementById('userEmail');
    if (user) {
        const uid = user.uid;
        const email = user.email || 'Unknown User';
        if (userEmailElement) {
            userEmailElement.textContent = email;
        }
        if (currentPath === '/login' || currentPath === '/signup') {
            window.location.href = '/index';
        }

    } else {
        if (userEmailElement) {
            userEmailElement.textContent = '';
        }
        if (currentPath === '/index') {
            window.location.href = '/login';
        }
    }
});

// Lưu từ mới vào Firestore
async function addEnglishWord(uid, word) {
    try {
        await addDoc(collection(db, "users", uid, "words"), { english: word });
        console.log("✅ Word added:", word);
    } catch (error) {
        console.error("❌ Add word failed:", error);
    }
}

window.addEnglishWord = addEnglishWord;

function listenToUserWords(uid, callback) {
    const wordsCol = collection(db, "users", uid, "words");
    onSnapshot(wordsCol, (snapshot) => {
        const words = [];
        snapshot.forEach((doc) => words.push({ id: doc.id, ...doc.data() }));
        callback(words);
    });
}

window.listenToUserWords = listenToUserWords;


function deleteWord(id) {
    const uid = localStorage.getItem("loggedInUserId");
    if (!uid) return;

    const ok = confirm("Bạn có chắc chắn muốn xoá từ này?");
    if (!ok) return;

    const docRef = doc(db, "users", uid, "words", id);
    deleteDoc(docRef)
        .then(() => console.log("✅ Đã xoá từ:", id))
        .catch(err => console.error("❌ Lỗi khi xoá:", err));
}

function editWord(id, oldValue) {
    const uid = localStorage.getItem("loggedInUserId");
    if (!uid) return;

    const newValue = prompt("Sửa từ:", oldValue);
    if (!newValue || newValue.trim() === oldValue) return;

    const docRef = doc(db, "users", uid, "words", id);
    updateDoc(docRef, { english: newValue.trim() })
        .then(() => console.log("✅ Đã cập nhật từ:", id))
        .catch(err => console.error("❌ Lỗi khi sửa:", err));
}

window.deleteWord = deleteWord;
window.editWord = editWord;

function enableEdit(id) {
    document.getElementById(`word-text-${id}`).style.display = 'none';
    document.getElementById(`edit-input-${id}`).style.display = 'inline';
    document.getElementById(`edit-btn-${id}`).style.display = 'none';
    document.getElementById(`save-btn-${id}`).style.display = 'inline';
    document.getElementById(`cancel-btn-${id}`).style.display = 'inline';
}

window.enableEdit = enableEdit;


function cancelEdit(id, oldValue) {
    document.getElementById(`word-text-${id}`).style.display = 'inline';
    document.getElementById(`edit-input-${id}`).style.display = 'none';
    document.getElementById(`edit-btn-${id}`).style.display = 'inline';
    document.getElementById(`save-btn-${id}`).style.display = 'none';
    document.getElementById(`cancel-btn-${id}`).style.display = 'none';
    document.getElementById(`edit-input-${id}`).value = oldValue;
}

window.cancelEdit = cancelEdit;

function saveEdit(id) {
    const uid = localStorage.getItem("loggedInUserId");
    if (!uid) return;

    const newValue = document.getElementById(`edit-input-${id}`).value.trim();
    if (!newValue) return;

    const docRef = doc(db, "users", uid, "words", id);
    updateDoc(docRef, { english: newValue })
        .then(() => {
            console.log("✅ Sửa thành công");
        })
        .catch(err => console.error("❌ Lỗi khi sửa:", err));
}


window.saveEdit = saveEdit;

