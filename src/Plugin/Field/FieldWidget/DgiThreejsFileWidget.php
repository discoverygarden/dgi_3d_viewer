<?php

namespace Drupal\dgi_3d_viewer\Plugin\Field\FieldWidget;

use Drupal\Core\Field\FieldItemListInterface;
use Drupal\Core\Form\FormStateInterface;
use Drupal\file\Plugin\Field\FieldWidget\FileWidget;

/**
 * Plugin implementation of the 'dgi_threejs_file_widget' widget.
 *
 * @FieldWidget(
 *   id = "dgi_threejs_file_widget",
 *   label = @Translation("3D Model File"),
 *   field_types = {
 *     "file"
 *   }
 * )
 */
class DgiThreejsFileWidget extends FileWidget
{

    /**
     * @inheritDoc
     */
    public static function process($element, FormStateInterface $form_state, $form)
    {
        // Testing library loading.
        $element['#attached']['library'][] = 'dgi_3d_viewer/test_threejs';
        // If file is uploaded, check if it is a supported format.
        if (!empty($element['#files'])) {
            $file = reset($element['#files']);
            $supported_formats = ['gltf', 'glb'];
            if (!in_array(pathinfo($file->getFileUri(), PATHINFO_EXTENSION), $supported_formats)) {
                $form_state->setError($element, t('The file type is not supported for viewing.'));
            }
            else {
                // The file exists and is a supported format, so we can add the viewer.
                // $element['#theme'] = 'dgi_3d_file_widget';
                // The only supported format is glTF (so far),
                // so no need to check which Loader to use, but making that a variable
                // now, so it's easier to change in the future when more Loaders are supported.
                $loader = 'GLTFLoader';
//          $element['#attached']['library'][] = 'dgi_3d_viewer/dgi_3d_viewer';
                // Define the preview container.
                $element['preview'] = [
                    '#theme' => 'canvas',
                    '#width' => '100%',
                    '#height' => '400px',
                    '#uri' => $file->getFileUri(),
                    '#attributes' => [
                        'class' => [
                            'dgi-3d-viewer',
                        ],
                        'data-model' => $file->getFileUri(),
                        'data-loader' => $loader,
                    ],
                ];
            }
        }
        return parent::process($element, $form_state, $form);
    }
}