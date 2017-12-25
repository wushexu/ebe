import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {HttpClientModule} from '@angular/common/http';

import {SuiModule} from 'ng2-semantic-ui';

import {AppRoutingModule} from './app-routing.module';

import {BookService} from './services/book.service';
import {ChapService} from './services/chap.service';
import {ParaService} from './services/para.service';
import {DictService} from './services/dict.service';
import {UserService} from './services/user.service';
import {UserBookService} from './services/user_book.service';

import {CreatedDatePipe} from './pipes/created-date.pipe';
import {CreatedDateStringPipe} from './pipes/created-date-string.pipe';

import {AppComponent} from './app.component';
import {BooksComponent} from './book/books.component';
import {BookComponent} from './book/book.component';
import {BookChapsComponent} from './book/book-chaps.component';
import {ChapComponent} from './chap/chap.component';
import {ChapParasComponent} from './chap/chap-paras.component';
import {ParaFormComponent} from './chap/para-form.component';
import {ParaSplitComponent} from './chap/para-split.component';
import {SentenceAlignComponent} from './content/sentence-align.component';
import {ParaContentComponent} from './content/para-content.component';
import {WordAnnosComponent} from './content/word-annos.component';
import {DictComponent} from './dict/dict.component';
import {DictEntryComponent} from './dict/dict-entry.component';
import {DictEntrySmiComponent} from './dict/dict-entry-smi.component';
import {UsersComponent} from './user/users.component';
import {UserComponent} from './user/user.component';
import {UserBookComponent} from './user/user-book.component';

@NgModule({
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    AppRoutingModule,
    SuiModule
  ],
  declarations: [
    AppComponent,
    BooksComponent,
    BookComponent,
    BookChapsComponent,
    ChapComponent,
    ChapParasComponent,
    ParaFormComponent,
    ParaSplitComponent,
    SentenceAlignComponent,
    ParaContentComponent,
    WordAnnosComponent,
    DictComponent,
    DictEntryComponent,
    DictEntrySmiComponent,
    UsersComponent,
    UserComponent,
    UserBookComponent,
    CreatedDatePipe,
    CreatedDateStringPipe
  ],
  providers: [
    BookService,
    ChapService,
    ParaService,
    DictService,
    UserService,
    UserBookService
  ],
  entryComponents: [
    ParaSplitComponent,
    SentenceAlignComponent,
    WordAnnosComponent
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}
