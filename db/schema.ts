import {sqliteTable,integer,text} from 'drizzle-orm/sqlite-core';
export const emailWatchlist=sqliteTable('email_watchlist',{
 id:integer('id').primaryKey(),
 idsJson:text('ids_json').notNull().default('[]'),
 revision:integer('revision').notNull().default(0),
 updatedAt:text('updated_at'),
 updatedBy:text('updated_by'),
});
