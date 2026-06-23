This project is not meant to be usable in any capacity, within a real setting. It will not have support past August, 2026.
## Askew, a modern way to handle student sign-ins
Introducing Askew, a way to monitor and handle student sign-ins without teacher hassle, along with features designed to protect privacy.
https://randomsquared.github.io/Askew/

## How to use
# 1 - prerequisites
Please use incognito mode when opening the website to prevent any previous cache from overriding your test.

Then open 2 instances of the website, one to log in as the teacher and one to log in as the student.

# 2 - Student
You can make a student account if desired, using your real email.
The site functions like this, the student enters a class code and self enrolls in the class. They then select the class and wait for roll to start marking. When the teacher starts marking, they can say that they are here, and thus mark themselves present. This will require your location to verify that your location is roughly the same as the teacher's.

# 3 - Teacher
You can make a teacher account if desired, however you will not be authenticated unless you have direct access to the supabase. Please use any test accounts provided.
The teacher's site functions like this, they can make a class, and then a code to join that class will be creaed. 
They can then start marking for that class by pressing a button, allowing students to mark themselves here. This will also require your locational information, temporarily stored on the database to crosscheck the student's location with yours. **ENSURE** that you close marking after all students have finished marking, as this is how your locational information is wiped off of the database.

# 4 - Misc. features
wait on the index screen for a minute
