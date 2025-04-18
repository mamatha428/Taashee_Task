create database Training;
use Training;
create table Hobby(
id int primary key auto_increment,
name varchar(32) not null,
added_by varchar(64) not null,
type varchar(1) default "I"
);
select *from Hobby;

create database journaling_app;

use journaling_app;
create table users(
  user_id int auto_increment primary key,
  username varchar(32) not null,
  password varchar(32) not null
  );
  
  insert into users values(1,"mamatha","password");
  insert into users values(2,"kumar","kumar123");
  
  select *from users;
  
  create table entries(
     entry_id int auto_increment primary key,
     user_id int,
     title varchar(100),
     content text,
     timestamp timestamp default current_timestamp,
     foreign key(user_id) references users(user_id)
     );
     
     
     select *from entries;
     
     alter table Hobby add column username varchar(64);
     
     update Hobby set username=added_by;
     
     alter table Hobby add column password varchar(64);
     
     update Hobby set password="password";
     
     select *from Hobby;
     
     alter table Hobby add column role varchar(16);
     
     update Hobby set role="user";
     
     update Hobby set role="admin" where id=6;
     
     update Hobby set password="$2a$10$gSUKSRAtwMi1aKmHQj2YwOtdaLuLix8AFt2rCD/WCrQtelM3Gb6QG";
     
     update Hobby set role=upper(role);
     
     
     alter table users add column role varchar(16);
     
     update users set role="USER";
     
     select *from users;
     
     update users set role="ADMIN" where user_id=1;
     
     update users set password="password" where user_id in(2,6);
     
     alter table users modify column password varchar(128);
     
     update users set password="$2a$09$DjHJ5cs.wUOsFuFqOmDc2.5NSlzz6um18zMPP6Vtv9ooFk4s5eDsu";
     
     delete from Hobby where id in(16,17);
     
     alter table Hobby modify column role varchar(16) default "USER";
     
     show tables;
     
     select *from role;
     
     delete from role where id=0;
     
     desc instructor;
     
     desc course;
     
     desc student;
     
     
     select *from student;
     
     select *from course;
     
     select *from instructor;
     
     select *from course_students;
     
     select *from user;
     
     select *from user_roles; 
     
     select *from role;
     
     update user set password="$2a$10$MzosjT.6q/YS3EUJG39HpO0te03RRDkTP1mYFod.okb4DtC7uOkWq";
     
     update student set user_id=1 where id=1;
     
     update student set user_id=2 where id=2;
     
     
      
     
  
  
  


