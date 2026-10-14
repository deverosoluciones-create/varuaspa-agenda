import {initializeApp} from 'firebase/app'
import {getAuth,GoogleAuthProvider} from 'firebase/auth'
import {getDatabase} from 'firebase/database'
const app=initializeApp({
apiKey:"AIzaSyCZSw-RSTuMmjbdAHQahw0x9FtLR0OWi8o",authDomain:"myagenda-afc88.firebaseapp.com",
databaseURL:"https://myagenda-afc88-default-rtdb.firebaseio.com",projectId:"myagenda-afc88",
storageBucket:"myagenda-afc88.firebasestorage.app",messagingSenderId:"1215781249",appId:"1:1215781249:web:09fcc8f3fc298f74f8f080"})
export const auth=getAuth(app),db=getDatabase(app),gp=new GoogleAuthProvider()
