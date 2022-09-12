
process.env.NODE_ENV = "test"

const request = require("supertest");


const app = require("../app");
const db = require("../db");


// isbn of sample book
let book_isbn;


beforeEach(async () => {
  let result = await db.query(`
    INSERT INTO
      books (isbn, amazon_url,author,language,pages,publisher,title,year)
      VALUES(
        '123432122',
        'https://amazon.com/taco',
        'Elie',
        'English',
        100,
        'Nothing publishers',
        'my first book', 2008)
      RETURNING isbn`);

  book_isbn = result.rows[0].isbn
});


describe("GET /books", function() {
  test("Gets all books", async function() {
    const response = await request(app).get("/books");
    expect(response.statusCode).toBe(200);
    expect(response.body.books[0]).toHaveProperty('isbn');
  })
})

describe("GET /books/:id", function() {
  test("Gets specific book", async function() {
    const response = await request(app).get(`/books/${book_isbn}`);
    expect(response.statusCode).toBe(200);
    expect(response.body.book).toHaveProperty('isbn');
  })

  test("Errors if specific book cannot be found", async function() {
    const response = await request(app).get('/books/0');
    expect(response.statusCode).toBe(404);
  })
})

describe("POST /books", function() {
  test("Creates new book", async function() {
    const response = await request(app).post("/books").send(
      {
      "isbn": "9780393970128",
        "amazon_url": "https://www.amazon.com/Dracula-Norton-Critical-Editions-Stoker/dp/0393970124#detailBullets_feature_div",
        "author": "Bram Stoker",
        "language": "english",
        "pages": 512,
        "publisher": "W. W. Norton & Company",
        "title": "Dracula",
        "year": 1996
      });

    expect(response.statusCode).toBe(201);
    expect(response.body.book).toHaveProperty("isbn");
  })


  test("Errors out if incorrect JSON Schema is used", async function() {
    const response = await request(app).post("/books").send(
      {
      "isbn": "9780393970128",
        "amazon_url": "https://www.amazon.com/Dracula-Norton-Critical-Editions-Stoker/dp/0393970124#detailBullets_feature_div",
        "author": "Bram Stoker",
        "pages": 512,
        "publisher": "W. W. Norton & Company",
        "title": "Dracula",
        "year": 1996
      });

      expect(response.statusCode).toBe(400);
  })
})


describe("PUT /books/:ibsn", function() {
  test("Updates existing book", async function() {
    const response = await request(app).put(`/books/${book_isbn}`).send({
        "amazon_url": "https://www.amazon.com/Dracula-Norton-Critical-Editions-Stoker/dp/0393970124#detailBullets_feature_div",
        "author": "Bram Stoker",
        "language": "english",
        "pages": 512,
        "publisher": "W. W. Norton & Company",
        "title": "Dracula",
        "year": 1996
    })
    expect(response.body.book).toHaveProperty("isbn");
    expect(response.body.book.title).toBe("Dracula");
  })


  test("Errors if cannot find book", async function() {
    const response = await request(app).put(`/books/0`).send({
      "amazon_url": "https://www.amazon.com/Dracula-Norton-Critical-Editions-Stoker/dp/0393970124#detailBullets_feature_div",
      "author": "Bram Stoker",
      "language": "english",
      "pages": 512,
      "publisher": "W. W. Norton & Company",
      "title": "Dracula",
      "year": 1996
    });

    expect(response.statusCode).toBe(404);
  })

  test("Prevents book update with bad data", async function() {
    const response = await request(app).put(`/books/${book_isbn}`).send({
      "amazon_url": "https://www.amazon.com/Dracula-Norton-Critical-Editions-Stoker/dp/0393970124#detailBullets_feature_div",
      "author": "Bram Stoker",
      "pages": 512,
      "publisher": "W. W. Norton & Company",
      "title": "Dracula",
      "year": 1996
  })
  expect(response.statusCode).toBe(400);
  })
})

describe("/DELETE book", function() {
  test("Delete specific book", async function() {
    const response = await request(app).delete(`/books/${book_isbn}`);
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ message: "Book deleted" });
  })
})


afterEach(async function () {
    await db.query("DELETE FROM BOOKS");
  });
  
  
  afterAll(async function () {
    await db.end()
  });
  