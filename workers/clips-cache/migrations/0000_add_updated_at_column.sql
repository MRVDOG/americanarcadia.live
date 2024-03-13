-- Migration number: 0000 	 2024-03-13T20:18:11.466Z
ALTER TABLE clips ADD updated_at;
UPDATE clips SET updated_at = CURRENT_TIMESTAMP;