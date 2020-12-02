create table users(
    id int not null,
    primary key(id),
    email varchar(100) not null,
    name varchar(50),
    password varchar(255) not null,
    account_confirmed bool not null default false,
    is_admin bool not null default false,
    created_date timestamp not null default current_timestamp,
    changed_date timestamp not null default current_timestamp on update current_timestamp
) engine = innodb;

create table events(
    id int not null,
    primary key(id),
    name varchar(255),
    start_date date not null,
    is_active bool not null default true,
    created_date timestamp not null default current_timestamp,
    changed_date timestamp not null default current_timestamp on update current_timestamp
) engine = innodb;

create table gifts(
    id int not null,
    primary key(id),
    event_id int not null,
    index eve_ind (event_id),
    foreign key (event_id)
        references events(id)
        on delete cascade,
    name varchar(255) not null,
    description text not null,
    link varchar(255),
    picture varchar(255),
    created_date timestamp not null default current_timestamp,
    changed_date timestamp not null default current_timestamp on update current_timestamp
) engine=innodb;


create table event_assignments(
    id int not null, 
    primary key(id), 
    role enum("Organiser", "Guest") not null default "Guest",
    user_id int not null, 
    index use_ind (user_id),
    foreign key (user_id)
        references users(id)
        on delete cascade,
    event_id int not null,
    index eve_ind (event_id),
    foreign key (event_id)
        references events(id)
        on delete cascade,
    created_date timestamp not null default current_timestamp,
    changed_date timestamp not null default current_timestamp on update current_timestamp
    ) engine=innodb;

create table reservations(
    id int not null,
    primary key(id),
    contact_number varchar(255),
    max_users int not null default 1,
    description text,
    gift_id int not null,
    index gif_ind (gift_id),
    foreign key(gift_id)
        references gifts(id)
        on delete cascade,
    assignment_id int not null,
    index ass_ind (assignment_id),
    foreign key(assignment_id)
    references event_assignments(id)
    on delete cascade,
    created_date timestamp not null default current_timestamp,
    changed_date timestamp not null default current_timestamp on update current_timestamp
) engine=innodb;

create table codes(
    id int not null,
    primary key(id),
    code varchar(50) not null,
    is_active bool not null,
    event_id int not null,
    index event_ind (event_id),
    foreign key(event_id)
    references events(id)
    on delete cascade,
    created_date timestamp not null default current_timestamp,
    changed_date timestamp not null default current_timestamp on update current_timestamp
) engine=innodb;