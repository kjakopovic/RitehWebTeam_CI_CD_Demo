exports.up = (pgm) => {
  pgm.createTable("projects", {
    id: "id",
    name: { type: "varchar(255)", notNull: true },
    description: { type: "text" },
    created_at: { type: "timestamp", default: pgm.func("NOW()") },
  });
};

exports.down = (pgm) => {
  pgm.dropTable("projects");
};
