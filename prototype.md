<is name='location-a' exclusive="true">
<h1>Location A<h1>

<is name='long-description'>
Long description
</is>

<is name='short-description'>
Short description
</is>

{% is-if !seen %}
{% is-add seen %}
Long description
{% is-end-if %}

{% is-if seen %}
Short description
{% is-end-if %}

{% is-new %}
Long description
{% is-old %}
Short description
{% is-end-new %}

{% is-update  %}

</is-state>