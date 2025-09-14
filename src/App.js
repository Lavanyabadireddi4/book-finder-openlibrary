import React, { useState } from "react";

export default function App() {
  const [query, setQuery] = useState("");
  const [searchBy, setSearchBy] = useState("title"); 
  const [books, setBooks] = useState([]);
  const [totalResults, setTotalResults] = useState(0);
  const [page, setPage] = useState(1);
  const LIMIT = 20; 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasMore, setHasMore] = useState(false);

  
  const formatDocs = (docs = []) =>
    docs.map((doc) => ({
      id: doc.key, 
      title: doc.title || "No title",
      authors: doc.author_name ? doc.author_name.join(", ") : "Unknown Author",
      year: doc.first_publish_year || "",
      thumbnail: doc.cover_i
        ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`
        : "https://via.placeholder.com/128x200?text=No+Image",
      openLibraryUrl: `https://openlibrary.org${doc.key}`,
    }));

  
  const fetchBooks = async ({ append = false, pageToFetch = 1 } = {}) => {
    if (!query.trim()) {
      setError("Please enter a book title or author");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const url = `https://openlibrary.org/search.json?${searchBy}=${encodeURIComponent(
        query
      )}&page=${pageToFetch}&limit=${LIMIT}`;

      const res = await fetch(url);
      if (!res.ok) throw new Error("Network response not ok");
      const data = await res.json();

      
      if (!data.docs || data.docs.length === 0) {
        if (!append) setBooks([]);
        setError("No books found. Try another search.");
        setHasMore(false);
        setTotalResults(0);
        return;
      }

      const formatted = formatDocs(data.docs);
      setBooks((prev) => (append ? [...prev, ...formatted] : formatted));
      setTotalResults(data.numFound || formatted.length);

      
      setHasMore(pageToFetch * LIMIT < (data.numFound || formatted.length));
    } catch (err) {
      console.error(err);
      setError("Failed to fetch books. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  
  const handleSearch = async () => {
    setPage(1);
    await fetchBooks({ append: false, pageToFetch: 1 });
  };

 
  const loadMore = async () => {
    const nextPage = page + 1;
    setPage(nextPage);
    await fetchBooks({ append: true, pageToFetch: nextPage });
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-yellow-50 p-6">
      <h1 className="text-3xl font-bold mb-6">📚 Book Finder (Open Library)</h1>

      <div className="flex flex-col sm:flex-row gap-2 mb-6 items-start sm:items-center">
        <input
          type="text"
          placeholder="Enter title or author"
          className="p-2 rounded-lg border border-gray-400 w-72"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />

        <select
          value={searchBy}
          onChange={(e) => setSearchBy(e.target.value)}
          className="p-2 rounded-lg border border-gray-400"
        >
          <option value="title">Search by Title</option>
          <option value="author">Search by Author</option>
        </select>

        <button
          onClick={handleSearch}
          className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700"
        >
          Search
        </button>
      </div>

      {loading && <p className="text-gray-600">Searching books...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {!error && !loading && totalResults > 0 && (
        <p className="mb-4 text-sm text-gray-600">
          Showing {books.length} of {totalResults} results
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {books.map((book) => (
          <a
            key={book.id}
            href={book.openLibraryUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white shadow-md p-4 rounded-lg w-64 hover:shadow-lg transition"
          >
            <img
              src={book.thumbnail}
              alt={book.title}
              className="h-48 w-full object-cover mb-2 rounded"
            />
            <h2 className="text-lg font-semibold">{book.title}</h2>
            <p className="text-sm text-gray-600 mb-1">Author(s): {book.authors}</p>
            <p className="text-sm text-gray-500">
              {book.year ? `First published: ${book.year}` : "Publication info not available"}
            </p>
          </a>
        ))}
      </div>

      {hasMore && (
        <button
          onClick={loadMore}
          className="mt-6 bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700"
        >
          {loading ? "Loading..." : "Load more"}
        </button>
      )}
    </div>
  );
}
