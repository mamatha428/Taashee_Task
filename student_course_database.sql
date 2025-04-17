create database Training;

use Training;

create table Hobby(
   id int primary key auto_increment,
   name varchar(32) not null,
   added_by varchar(64) not null,
   type char(1) default "I"
   );
   
   insert into Hobby values(1,"journaling","mamatha","I");
   
   select *from Hobby;
   
   
   alter table Hobby add column username varchar(32);
   
   select *from Hobby;
   
   update Hobby set username=lower(added_by);
   
   UPDATE Hobby
SET added_by = CONCAT(UPPER(SUBSTRING(added_by, 1, 1)), LOWER(SUBSTRING(added_by, 2)));

update Hobby set name="journaling" where id=1;

update Hobby set name="badminton" where id=2;
update Hobby set name="helping others" where id=3;

alter table Hobby add column password varchar(32);

update Hobby set password="password";


create database journaling_app;

use journaling_app;

create table users(
   user_id int  auto_increment primary key,
   username varchar(32) not null,
   password varchar(32) not null
   );
   
   CREATE TABLE entries (
    entry_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    title VARCHAR(100),
    content TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);
   
   select *from users;
   
   select *from entries;
   
   insert into users values(3,"miheera","password");
   
   insert into users values(4,"arjun","password");
   
   desc student;
   
   insert into student values(1,"mamatha");
   insert into student values(2,"kumar");
   desc course;
   insert into instructor values(1,"ranjith");
   insert into course values(1,"machine learning",1);
   
   select *from student;
   
   select *From instructor;
   
   select *from course;
   
   select *from course_students;
   
   
   
   



   
   
   
   