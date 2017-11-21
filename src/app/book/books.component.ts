import {Component, OnInit} from '@angular/core';
import {Router} from '@angular/router';

import {Book} from '../models/book';
import {BookService} from '../services/book.service';
import {OpResult} from '../models/op-result';

@Component({
  selector: 'book-list',
  templateUrl: './books.component.html',
  styleUrls: ['./books.component.css']
})
export class BooksComponent implements OnInit {
  books: Book[];
  editNew = false;

  constructor(private bookService: BookService,
              private router: Router) {
  }

  getBooks(): void {
    this.bookService
      .list()
      .subscribe(books => this.books = books);
  }

  add(name: string, author: string, zhName: string, zhAuthor: string): void {
    name = name.trim();
    if (!name) {
      return;
    }
    author = author.trim();
    zhName = zhName.trim();
    zhAuthor = zhAuthor.trim();
    let model = {name, author, zhName, zhAuthor} as Book;
    this.bookService.create(model)
      .subscribe(book => {
        this.books.push(book);
        this.editNew = false;
      });
  }

  remove(book: Book): void {
    if (!confirm('Are You Sure?')) {
      return;
    }
    this.bookService
      .remove(book._id)
      .subscribe((opr: OpResult) => {
        if (opr.ok === 0) {
          alert(opr.message || 'Fail');
          return;
        }
        this.books = this.books.filter(b => b !== book);
      });
  }

  ngOnInit(): void {
    this.getBooks();
  }

  gotoDetail(book: Book): void {
    this.router.navigate(['/books', book._id]);
  }

  bookTracker(index, book) {
    return book._id;
  }

}
