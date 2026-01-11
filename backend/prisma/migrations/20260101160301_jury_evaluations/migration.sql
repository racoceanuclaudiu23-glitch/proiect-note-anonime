-- CreateTable
CREATE TABLE "Jury" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "projectId" INTEGER NOT NULL,
    "deliverableId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Jury_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Jury_deliverableId_fkey" FOREIGN KEY ("deliverableId") REFERENCES "Deliverable" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "JuryMember" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "juryId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "assignedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "JuryMember_juryId_fkey" FOREIGN KEY ("juryId") REFERENCES "Jury" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "JuryMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Evaluation" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "juryId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "score" REAL NOT NULL,
    "comment" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Evaluation_juryId_fkey" FOREIGN KEY ("juryId") REFERENCES "Jury" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Evaluation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Jury_projectId_deliverableId_key" ON "Jury"("projectId", "deliverableId");

-- CreateIndex
CREATE UNIQUE INDEX "JuryMember_juryId_userId_key" ON "JuryMember"("juryId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Evaluation_juryId_userId_key" ON "Evaluation"("juryId", "userId");
