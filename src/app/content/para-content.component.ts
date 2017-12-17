import {
  OnChanges, Input, Output, EventEmitter, SimpleChanges,
  Component, ViewChild, ViewContainerRef, ChangeDetectorRef
} from '@angular/core';

import {Annotator} from '../anno/annotator';
import {HighlightGroups} from '../anno/annotations';

import {DictEntry} from '../models/dict-entry';
import {DictService} from '../services/dict.service';
import {ParaLiveContent} from '../chap-types/para-live-content';
import {DictRequest} from '../chap-types/dict-request';
import {NoteRequest} from '../chap-types/note-request';
import {Annotation} from '../anno/annotation';

@Component({
  selector: 'para-content',
  templateUrl: './para-content.component.html',
  styleUrls: ['./para-content.component.css']
})
export class ParaContentComponent implements OnChanges {
  @ViewChild('paraText', {read: ViewContainerRef}) paraText: ViewContainerRef;
  @ViewChild('paraTrans', {read: ViewContainerRef}) paraTrans: ViewContainerRef;
  @Input() content: string;
  @Input() trans: string;
  @Input() showTrans: boolean;
  @Input() gotFocus: boolean;
  @Input() editable: boolean;
  @Input() highlightSentence: boolean;
  @Input() annotating: boolean;
  @Input() annotation: Annotation;
  @Output() contentChange = new EventEmitter<ParaLiveContent>();
  @Output() contentCommand = new EventEmitter<string>();
  @Output() dictRequest = new EventEmitter<DictRequest>();
  @Output() noteRequest = new EventEmitter<NoteRequest>();
  _annotator: Annotator;
  beenChanged = false;
  contentChanged = false;
  transChanged = false;
  transRendered = false;
  sentenceHoverSetup = false;
  wordsHoverSetup = false;
  highlightedSentences: Element[] = [];
  highlightedWords: Element[] = [];

  static sentenceTagName = 's-st';
  static highlightClass = 'highlight';
  static highlightWordsSelector = HighlightGroups.highlightAnnotationSelectors;

  constructor(private dictService: DictService, private cdr: ChangeDetectorRef) {
  }

  get annotator() {
    if (!this._annotator) {
      let contentEl = this.paraText.element.nativeElement;
      this._annotator = new Annotator(contentEl);
    }
    this._annotator.switchAnnotation(this.annotation);
    return this._annotator;
  }

  private removeTagIfDummy(el) {
    if (el.tagName !== Annotator.annotationTagName.toUpperCase()) {
      return false;
    }
    let changed = false;
    if (el.className === '') {
      el.removeAttribute('class');
      changed = true;
    }
    if (!el.hasAttributes()) {
      //remove tag
      let pp = el.parentNode;
      if (!pp) {
        return changed;
      }
      while (el.firstChild) {
        pp.insertBefore(el.firstChild, el);
      }
      pp.removeChild(el);
      pp.normalize();
      changed = true;
    }
    return changed;
  };

  selectWordMeaning() {
    let element: any = this.annotator.annotate();
    if (!element) {
      return;
    }
    let word = element.textContent;

    let oriMid = null;
    if (element.dataset.mid) {
      let mid = parseInt(element.dataset.mid);
      if (!isNaN(mid)) {
        oriMid = mid;
      }
    }
    let oriForWord = element.dataset.word || word;

    let meaningItemCallback = (selected: { word: string, selectedItemId: number }) => {
      let mid;
      let forWord;
      if (selected) {
        mid = selected.selectedItemId;
        forWord = selected.word;
      } else {
        mid = null;
        forWord = null;
      }
      if (mid == null) {
        // cancel
        let changed = this.removeTagIfDummy(element);
        if (changed) {
          // this.onContentChange();
        }
      } else {
        if (mid === -1) {
          //unset
          element.removeAttribute('data-mid');
          if (element.dataset.word) {
            element.removeAttribute('data-word');
          }
          this.removeTagIfDummy(element);
        } else {
          element.dataset.mid = '' + mid;
          if (forWord !== oriForWord) {
            element.dataset.word = forWord;
          }
        }
        this.onContentChange();
      }
    };

    this.dictService.getEntry(oriForWord, {base: true, stem: true})
      .subscribe((entry: DictEntry) => {
        if (entry == null) {
          this.removeTagIfDummy(element);
          return;
        }
        let dr = new DictRequest();
        dr.wordElement = element;
        dr.dictEntry = entry;
        dr.meaningItemId = oriMid;
        dr.relatedWords = null;
        dr.meaningItemCallback = meaningItemCallback;
        if (oriForWord !== word) {
          dr.relatedWords = [word];
        }
        this.dictRequest.emit(dr);
      });
  }

  addANote() {
    let element: any = this.annotator.annotate();
    if (!element) {
      return;
    }
    let oriNote = element.dataset.note;

    let editNoteCallback = (note: string) => {
      let changed = false;
      if (note === null || note === oriNote) {
        // cancel
        this.removeTagIfDummy(element);
      } else {
        if (note === '') {
          // delete
          element.removeAttribute('data-note');
          this.removeTagIfDummy(element);
          if (typeof oriNote !== 'undefined') {
            changed = true;
          }
        } else {
          element.dataset.note = note;
          changed = true;
        }
      }
      if (changed) {
        this.onContentChange();
      }
    };

    let nr = new NoteRequest();
    nr.wordElement = element;
    nr.note = oriNote || '';
    nr.editNoteCallback = editNoteCallback;
    this.noteRequest.emit(nr)
  }

  private doAnnotate() {
    if (this.annotation.nameEn === 'SelectWordMeaning') {
      this.selectWordMeaning();
    } else if (this.annotation.nameEn === 'AddANote') {
      this.addANote();
    } else {
      let annotatedEl = this.annotator.annotate();
      if (annotatedEl) {
        this.onContentChange();
        if (annotatedEl.matches(ParaContentComponent.highlightWordsSelector)) {
          this.highlightWord(annotatedEl);
        }
      }
    }
  }

  onMouseup($event) {
    if (!this.gotFocus || !this.annotating || !this.annotation) {
      return;
    }
    $event.stopPropagation();
    this.doAnnotate();
  }

  onKeyup($event) {
    $event.stopPropagation();
    if (!this.editable) {
      return;
    }
    this.onContentChange();
  }

  private onContentChange() {
    if (this.contentChanged) {
      return;
    }
    this.beenChanged = true;
    this.contentChanged = true;
    this.contentChange.emit(this.getLiveContent.bind(this));
  }

  onTransKeyup($event) {
    $event.stopPropagation();
    if (!this.editable) {
      return;
    }
    if (this.transChanged) {
      return;
    }
    this.beenChanged = true;
    this.transChanged = true;
    this.contentChange.emit(this.getLiveContent.bind(this));
  }

  private parseHtml(contentEl) {
    contentEl = contentEl.cloneNode(true);
    let contents = [];
    //:scope > .part
    let textEls = contentEl.querySelectorAll('.para-text > .part');
    if (textEls.length === 0) {
      textEls = [contentEl];
    }
    for (let textEl of textEls) {
      let toStripEls = textEl.querySelectorAll('br');
      for (let toStrip of toStripEls) {
        let pn = toStrip.parentNode;
        if (pn) {
          pn.removeChild(toStrip);
        }
      }
      let hlEls = textEl.querySelectorAll('.' + ParaContentComponent.highlightClass);
      for (let hlEl of hlEls) {
        hlEl.classList.remove(ParaContentComponent.highlightClass);
        if (hlEl.classList.length === 0) {
          hlEl.removeAttribute('class');
        }
      }
      contents.push(textEl.innerHTML);
    }
    return contents.join('\n');
  }

  getLiveContent() {

    let contents: any = {};

    if (this.contentChanged) {
      let contentEl = this.paraText.element.nativeElement;
      contents.content = this.parseHtml(contentEl);
      this.contentChanged = false;
    }
    if (this.transChanged) {
      let transEl = this.paraTrans.element.nativeElement;
      contents.trans = this.parseHtml(transEl);
      this.transChanged = false;
    }

    return contents;
  }

  notifySave() {
    this.contentCommand.emit('save');
  }

  discard() {
    this.contentCommand.emit('discard');
    if (this.contentChanged) {
      this.contentChanged = false;
      this.refreshContent();
    }
    if (this.transChanged) {
      this.transChanged = false;
      this.refreshTrans();
    }
  }

  private clearSentenceHighlights() {
    let hls = this.highlightedSentences;
    while (hls.length > 0) {
      let hl = hls.pop();
      hl.classList.remove(ParaContentComponent.highlightClass);
    }
  }

  private clearWordHighlights() {
    let hls = this.highlightedWords;
    while (hls.length > 0) {
      let hl = hls.pop();
      hl.classList.remove(ParaContentComponent.highlightClass);
    }
  }

  private setupSentenceHover() {

    if (this.sentenceHoverSetup || !this.highlightSentence || !this.gotFocus) {
      return;
    }

    let contentEl = this.paraText.element.nativeElement;
    let transEl = this.paraTrans.element.nativeElement;
    let contentMap = new Map<string, Element>();
    let transMap = new Map<string, Element>();
    for (let [textEl, selMap] of [[contentEl, contentMap], [transEl, transMap]]) {
      let sentenceEls = textEl.querySelectorAll(ParaContentComponent.sentenceTagName);
      for (let stEl of sentenceEls) {
        if (!stEl.dataset) {
          continue;
        }
        let sid = stEl.dataset.sid;
        if (sid) {
          selMap.set(sid, stEl);
        }
      }
    }

    let component = this;

    let sentenceMouseover = function (event) {
      if (!component.highlightSentence || !component.gotFocus) {
        return;
      }
      let el = this;
      if (!el.dataset) {
        return;
      }
      let sid = el.dataset.sid;
      if (!sid) {
        return;
      }

      component.clearSentenceHighlights();
      for (let selMap of [contentMap, transMap]) {
        let tsEl = selMap.get(sid);
        if (tsEl) {
          tsEl.classList.add(ParaContentComponent.highlightClass);
          component.highlightedSentences.push(tsEl);
        }
      }
    };

    for (let textEl of [contentEl, transEl]) {
      let sentenceEls = textEl.querySelectorAll(ParaContentComponent.sentenceTagName);
      for (let sentenceEl of sentenceEls) {
        sentenceEl.addEventListener('mouseover', sentenceMouseover);
      }
    }

    this.sentenceHoverSetup = true;
  }

  private closest(node, selector): any {
    do {
      if (node instanceof Element) {
        let el = node as Element;
        if (el.matches('.para-text')) {
          return null;
        }
        if (el.matches(selector)) {
          return el;
        }
      }
      node = node.parentNode;
    } while (node);
    return null;
  }

  private highlightWord(wordEl) {

    let component = this;

    let wordsMouseleave = function (event) {
      component.clearWordHighlights();
    };

    let wordsMouseover = function (event) {
      if (!component.gotFocus) {
        return;
      }
      component.clearWordHighlights();

      let el = this;
      let stEl = component.closest(el, ParaContentComponent.sentenceTagName);
      if (!stEl) {
        stEl = component.paraText.element.nativeElement;
      }

      let groupSelector = HighlightGroups.matchGroup(el);
      if (!groupSelector) {
        return;
      }
      let annEls = stEl.querySelectorAll(groupSelector);
      for (let annEl of annEls) {
        annEl.classList.add(ParaContentComponent.highlightClass);
        component.highlightedWords.push(annEl);
      }
    };

    wordEl.addEventListener('mouseover', wordsMouseover);
    wordEl.addEventListener('mouseleave', wordsMouseleave);
  }

  private setupWordsHover() {

    if (this.wordsHoverSetup || !this.gotFocus) {
      return;
    }

    let contentEl = this.paraText.element.nativeElement;
    let annEls = contentEl.querySelectorAll(ParaContentComponent.highlightWordsSelector);
    for (let annEl of annEls) {
      this.highlightWord(annEl);
    }

    this.wordsHoverSetup = true;
  }

  refreshContent() {
    let html = this.content || ' ';
    html = `<div class="part">${html}</div>`;
    this.paraText.element.nativeElement.innerHTML = html;
  }

  refreshTrans() {
    let html = this.trans || ' ';
    html = `<div class="part">${html}</div>`;
    this.paraTrans.element.nativeElement.innerHTML = html;
    this.transRendered = true;
  }

  ngOnChanges(changes: SimpleChanges) {
    let needClearSentenceHighlights = false;
    let maySetupSentenceHover = false;
    let needClearWordsHighlights = false;
    let maySetupWordsHover = false;
    if (changes.gotFocus) {
      if (this.gotFocus) {
        maySetupSentenceHover = true;
        maySetupWordsHover = true;
      } else {
        needClearSentenceHighlights = true;
        needClearWordsHighlights = true;
      }
    }
    if (changes.highlightSentence) {
      if (this.highlightSentence) {
        maySetupSentenceHover = true;
      } else {
        needClearSentenceHighlights = true;
      }
    }
    if (changes.trans) {
      this.transRendered = false;
    }
    if (this.showTrans && !this.transRendered) {
      this.refreshTrans();
      this.sentenceHoverSetup = false;
      maySetupSentenceHover = true;
    }
    if (changes.content) {
      this.refreshContent();
      this.sentenceHoverSetup = false;
      this.wordsHoverSetup = false;
      maySetupSentenceHover = true;
      maySetupWordsHover = true;
    } else if (changes.annotation) {
      if (this.gotFocus && this.annotating && this.annotation) {
        let annotator = this.annotator;
        let wacins = annotator.wordAtCursorIfNoSelection;
        annotator.wordAtCursorIfNoSelection = false;
        this.doAnnotate();
        annotator.wordAtCursorIfNoSelection = wacins;
      }
    }

    if (needClearSentenceHighlights || maySetupSentenceHover) {
      this.clearSentenceHighlights();
    }
    if (maySetupSentenceHover) {
      this.setupSentenceHover();
    }

    if (needClearWordsHighlights || maySetupWordsHover) {
      this.clearWordHighlights();
    }
    if (maySetupWordsHover) {
      this.setupWordsHover();
    }

    // if (changes.gotFocus) {
    //   if (this.gotFocus) {
    //     this.cdr.reattach();
    //   } else {
    //     setTimeout(() => {
    //       this.cdr.detach();
    //     }, 0);
    //   }
    // }
  }
}
