<?php

namespace Drupal\dgi_3d_viewer\Plugin\Field\FieldFormatter;

use Drupal\Core\Field\FieldItemListInterface;
use Drupal\Core\Plugin\ContainerFactoryPluginInterface;
use Drupal\file\Plugin\Field\FieldFormatter\FileFormatterBase;

/**
 * Plugin implementation of the 'dgi_threejs_file_formatter' formatter.
 *
 * @FieldFormatter(
 *   id = "dgi_threejs_file_formatter",
 *   label = @Translation("3D Model File"),
 *   field_types = {
 *     "file"
 *   }
 * )
 */
class DgiThreejsFileFormatter extends FileFormatterBase implements ContainerFactoryPluginInterface
{

    /**
     * @inheritDoc
     */
    public function viewElements(FieldItemListInterface $items, $langcode)
    {
        // TODO: Implement viewElements() method.
    }
}