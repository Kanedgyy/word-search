ALTER TABLE "game_players" ADD COLUMN "difficulty" varchar;--> statement-breakpoint
ALTER TABLE "game_players" ADD COLUMN "words_found" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "game_sessions" ADD COLUMN "rematch_session_id" uuid;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "password_hash" text DEFAULT '';