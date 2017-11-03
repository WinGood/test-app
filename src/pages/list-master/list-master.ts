import { Component, NgZone } from '@angular/core';
import { IonicPage, ModalController, NavController, ActionSheetController, Platform, ToastController } from 'ionic-angular';

import { Item } from '../../models/item';
import { Items } from '../../providers/providers';
import { IonicDeploy } from '../../IonicDeploy';

declare var IonicCordova;

@IonicPage()
@Component({
  selector: 'page-list-master',
  templateUrl: 'list-master.html'
})
export class ListMasterPage {
  currentItems: Item[];
  runningDeploy: boolean = false;

  constructor(public navCtrl: NavController, public items: Items, public modalCtrl: ModalController, public actionSheetCtrl: ActionSheetController, public platform: Platform, public toastCtrl: ToastController, public zone: NgZone, public ionicDeploy: IonicDeploy) {
    this.currentItems = this.items.query();
  }

  /**
   * The view loaded, let's query our items for the list
   */
  ionViewDidLoad() {
  }

  /**
   * Prompt the user to add a new item. This shows our ItemCreatePage in a
   * modal and then adds the new item to our data source if the user created one.
   */
  addItem() {
    let addModal = this.modalCtrl.create('ItemCreatePage');
    addModal.onDidDismiss(item => {
      if (item) {
        this.items.add(item);
      }
    })
    addModal.present();
  }

  /**
   * Delete an item from the list of items.
   */
  deleteItem(item) {
    this.items.delete(item);
  }

  /**
   * Navigate to the detail page for this item.
   */
  openItem(item: Item) {
    this.navCtrl.push('ItemDetailPage', {
      item: item
    });
  }

  presentActionSheet() {
    let actionSheet = this.actionSheetCtrl.create({
      title: 'Select deploy channel',
      buttons: [
        {
          text: 'Master',
          handler: () => {
            this.changeDeplayChannel('Master');
          }
        },{
          text: 'Production',
          handler: () => {
            this.changeDeplayChannel('Production');
          }
        },{
          text: 'Cancel',
          role: 'cancel',
          handler: () => {}
        }
      ]
    });
    actionSheet.present();
  }
  
  private changeDeplayChannel(channelName: string) {
    if (this.platform.is('cordova')) {
      if (this.runningDeploy) return;

      // this.ionicDeploy.getVersions()
      //   .then((result: any) => {
      //     console.log('getVersions', result);
      //     if (result && result.length) {
      //       const promises = result.map(version => this.ionicDeploy.deleteVersion(version));
      //       Promise.all(promises)
      //         .then(result => {
      //           console.log('all versions has been deleted', result);
      //         })
      //         .catch(err => {
      //           console.log('error has occured', err);
      //         });
      //     }
      //   });


      this.ionicDeploy.info()
        .then(result => {
          console.log('info', result);
        });

      let toast = this.toastCtrl.create({
        message: 'Downloading .. 0%',
        position: 'bottom',
        showCloseButton: false,
        closeButtonText: 'Cancel'
      });

      this.ionicDeploy.setChannel(channelName)
        .then(() => this.ionicDeploy.check())
        .then(snapshotAvailable => {
          if (snapshotAvailable) {
            toast.present();
            this.runningDeploy = true;
            return this.ionicDeploy.download(percent => {
              console.log('percent download', percent);
              toast.setMessage('Downloading .. ' + percent + '%');
            });
          }
        })
        .then(() => {
          return this.ionicDeploy.extract(percent => {
            console.log('percent extract', percent);
            toast.setMessage('Extracting .. ' + percent + '%');
          });
        })
        .then(() => this.ionicDeploy.load())
        .then(() => toast.dismiss())
        .then(() => this.runningDeploy = false)
        .catch(() => {
          console.log('catch');
          this.runningDeploy = false;
          this.zone.run(() => {
            toast.setMessage('Sorry there was network problem, we will try' +
              ' again next time the app loads!');
          });
        });
    }
  }
}
