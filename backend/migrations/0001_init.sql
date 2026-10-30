-- seq is a per-household write counter: every sync that writes bumps it, and each changed row records it,
-- so a client asks for "everything after the seq I last saw" without relying on clocks.
CREATE TABLE households (
  id TEXT PRIMARY KEY,
  invite TEXT NOT NULL UNIQUE,
  seq INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);

-- Only the hash of a device token is stored, so a leaked database does not hand out working tokens.
CREATE TABLE devices (
  token_hash TEXT PRIMARY KEY,
  household_id TEXT NOT NULL REFERENCES households (id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL
);
CREATE INDEX devices_household ON devices (household_id);

-- data is the item as JSON, or NULL for a deleted item (a tombstone, so the delete reaches other devices).
CREATE TABLE items (
  household_id TEXT NOT NULL REFERENCES households (id) ON DELETE CASCADE,
  id TEXT NOT NULL,
  data TEXT,
  seq INTEGER NOT NULL,
  PRIMARY KEY (household_id, id)
);
CREATE INDEX items_seq ON items (household_id, seq);

CREATE TABLE checked (
  household_id TEXT NOT NULL REFERENCES households (id) ON DELETE CASCADE,
  destination TEXT NOT NULL,
  item_id TEXT NOT NULL,
  checked INTEGER NOT NULL,
  seq INTEGER NOT NULL,
  PRIMARY KEY (household_id, destination, item_id)
);
CREATE INDEX checked_seq ON checked (household_id, seq);
