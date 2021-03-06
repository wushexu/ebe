import {Component, OnInit} from '@angular/core';
import {Router} from '@angular/router';

import {AnnotationFamily} from '../models/annotation-family';
import {AnnotationFamilyService} from "../services/annotation-family.service";
import {OpResult} from "../models/op-result";

@Component({
  selector: 'annotation-family-list',
  templateUrl: './annotation-family-list.component.html',
  styleUrls: ['./annotation-family-list.component.css']
})
export class AnnotationFamilyListComponent implements OnInit {

  families: AnnotationFamily[];
  editingFamily: AnnotationFamily;

  cloneOperation = false;
  removeOperation = false;

  constructor(private annotationFamilyService: AnnotationFamilyService,
              private router: Router) {
  }

  ngOnInit() {
    this.annotationFamilyService.list()
      .subscribe(families => {
        this.families = families;
      });
  }

  gotoDetail(family: AnnotationFamily): void {
    this.router.navigate(['/annotation-families', family._id]);
  }


  edit(af) {
    this.editingFamily = Object.assign({}, af);
  }

  editing(af) {
    return this.editingFamily && this.editingFamily._id === af._id;
  }

  save() {
    let editingFamily = this.editingFamily;
    this.annotationFamilyService.update(editingFamily)
      .subscribe(opr => {
        if (opr.ok === 0) {
          alert(opr.message || 'Fail');
          return;
        }
        let family = this.families.find(u => u._id === editingFamily._id);
        Object.assign(family, editingFamily);
        this.editingFamily = null;
      });
  }

  remove(af) {
    if (!confirm('Are You Sure?')) {
      return;
    }
    this.annotationFamilyService
      .remove(af._id)
      .subscribe((opr: OpResult) => {
        if (opr.ok === 0) {
          alert(opr.message || 'Fail');
          return;
        }
        this.families = this.families.filter(c => c !== af);
      });
  }

  clone(af: AnnotationFamily): void {
    if (!confirm('... To Clone?')) {
      return;
    }
    this.annotationFamilyService.clone(af._id).subscribe(clonedFamily => {
      if (!clonedFamily) {
        alert('Fail To Clone.');
        return;
      }
      let index = this.families.indexOf(af);
      this.families.splice(index + 1, 0, clonedFamily);
    });
  }

  tracker(index, af) {
    return af._id;
  }
}
