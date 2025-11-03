const fs = require("fs/promises");
const path = require("path");

const dataDirectory = path.join(__dirname, "..", "data");
const contactsFilePath = path.join(dataDirectory, "contacts.json");

async function ensureContactStore() {
  await fs.mkdir(dataDirectory, { recursive: true });

  try {
    await fs.access(contactsFilePath);
  } catch (error) {
    await fs.writeFile(contactsFilePath, "[]", "utf8");
  }
}

async function readContacts() {
  const raw = await fs.readFile(contactsFilePath, "utf8");

  try {
    const parsed = JSON.parse(raw);

    if (Array.isArray(parsed)) {
      return parsed;
    }

    return [];
  } catch (error) {
    await fs.writeFile(contactsFilePath, "[]", "utf8");
    return [];
  }
}

async function appendContact(contact) {
  const contacts = await readContacts();
  contacts.push(contact);
  await fs.writeFile(
    contactsFilePath,
    `${JSON.stringify(contacts, null, 2)}\n`,
    "utf8",
  );
}

module.exports = {
  ensureContactStore,
  appendContact,
  contactsFilePath,
};
