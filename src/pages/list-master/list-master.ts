import { Component, NgZone } from '@angular/core';
import { IonicPage, ModalController, NavController, ActionSheetController, Platform, ToastController } from 'ionic-angular';

import { Item } from '../../models/item';
import { Items } from '../../providers/providers';

declare var IonicCordova;

@IonicPage()
@Component({
  selector: 'page-list-master',
  templateUrl: 'list-master.html'
})
export class ListMasterPage {
  currentItems: Item[];
  runningDeploy: boolean = false;

  constructor(public navCtrl: NavController, public items: Items, public modalCtrl: ModalController, public actionSheetCtrl: ActionSheetController, public platform: Platform, public toastCtrl: ToastController, public zone: NgZone) {
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
    console.log('changeDeplayChannel');
    if (this.platform.is('cordova')) {
      console.log('changeDeplayChannel1');
      IonicCordova.deploy.init({
        appId: '0f468111',
        channel: channelName
      }, () => {
        console.log('IonicCordova init - success');
        IonicCordova.deploy.check(result => {
          console.log('IonicCordova check - success', result);
          const snapshotAvailable = (result === 'true') ? true : false;
          if (snapshotAvailable) {
            this.runningDeploy = true;

            let updateMe = true;
            let toast = this.toastCtrl.create({
              message: 'Downloading .. 0%',
              position: 'bottom',
              showCloseButton: false,
              closeButtonText: 'Cancel'
            });

            toast.onDidDismiss(() => {
              updateMe = false;
            });

            toast.present();

            this.zone.run(() => {
              IonicCordova.deploy.download(percent => {
                console.log('IonicCordova download - success', percent);
                toast.setMessage('Downloading .. ' + percent + '%');

                if (percent === 100) {
                  if (updateMe) {
                    IonicCordova.deploy.extract(percent => {
                      console.log('IonicCordova extract - success', percent);
                      toast.setMessage('Extracting .. ' + percent + '%');
                      if (percent === 100) {
                        if (updateMe) {
                          IonicCordova.deploy.redirect(result => {
                            console.log('IonicCordova redirect - success', result);
                          }, () => {
                            console.log('IonicCordova redirect - error');
                          });
                        }
                        this.runningDeploy = false;
                      }
                    }, () => {
                      console.log('IonicCordova extract - error');
                      this.runningDeploy = false; // for every error cb
                    });
                  }
                }
              }, () => {
                console.log('IonicCordova download - error');
              });
            });
          }
        }, () => {
          console.log('IonicCordova check - error');
        });
      }, () => {
        console.log('IonicCordova init - error');
      });
    }
  }
}
